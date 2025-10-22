package main

import (
	"net/http"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/junosixteen/mangle/engine"
	"os/signal"
	"context"
	"time"
	"path/filepath"
	"io/ioutil"
	"log"
)

func must(err error) { 
	if err != nil { 
		log.Fatalf("Fatal error: %v", err)
	} 
}

func loadProgram() string {
	// Erweiterte Regeln laden
	parts := []string{
		"../../rules/junosixteen.mg",
		"../../rules/certs.mg", 
		"../../rules/game.mg",
		"../../rules/time.mg",
		"../../rules/progress.mg",
		"../../rules/leaderboard.mg",
		"../../rules/explainability.mg"
	}
	acc := ""
	for _, p := range parts {
		fullPath := filepath.Clean(p)
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			log.Printf("Warning: Rule file %s not found, skipping", fullPath)
			continue
		}
		b, err := ioutil.ReadFile(fullPath)
		if err != nil {
			log.Printf("Warning: Could not read %s: %v", fullPath, err)
			continue
		}
		acc += "\n" + string(b)
		log.Printf("Loaded rules from: %s", fullPath)
	}
	return acc
}

func main() {
	log.Printf("🚀 Starting JunoSixteen Mangle Service...")
	
	useMemory := os.Getenv("MANGLE_FAKE") == "1"
	var eng engine.Engine
	if useMemory {
		log.Printf("Using Memory Engine (FAKE mode)")
		eng = engine.NewMemoryEngine()
	} else {
		log.Printf("Using Google Mangle Engine")
		eng = engine.NewMangleEngine()
	}
	
	program := loadProgram()
	log.Printf("Loading program with %d characters", len(program))
	must(eng.Load(program))

	r := gin.Default()
	
	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	
	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok", 
			"engine": "mangle",
			"version": "0.1.0",
			"timestamp": time.Now().UTC().Format(time.RFC3339)
		})
	})
	
	// Info and version endpoints
	r.GET("/info", infoHandler)
	r.GET("/version", versionHandler)

	// Main evaluation endpoint
	r.POST("/eval", func(c *gin.Context) {
		var req engine.QueryRequest
		if err := c.BindJSON(&req); err != nil {
			log.Printf("Invalid request: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		log.Printf("Evaluating query: %s with %d facts", req.Query, len(req.Facts))
		res, err := eng.Eval(req)
		if err != nil {
			log.Printf("Evaluation error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, res)
	})

	// Updated port to 8088
	port := os.Getenv("PORT")
	if port == "" {
		port = "8088"
	}
	
	srv := &http.Server{Addr: ":" + port, Handler: r}
	go func() { 
		log.Printf("🌐 Mangle Service listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()
	
	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	log.Printf("🛑 Shutting down Mangle Service...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	log.Printf("✅ Mangle Service stopped")
} 