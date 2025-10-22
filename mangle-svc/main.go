package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/mangle/engine"
	"github.com/google/mangle/lang"
)

type EvalRequest struct {
	Facts []string `json:"facts"` // z.B. "Attempt(42, 11, 5, \"risk\", true, \"2025-08-24T13:10Z\")."
	Rules []string `json:"rules"` // Datalog-Programme
	Query string   `json:"query"` // z.B. "EligibleCertificate(u, m)."
}

func main() {
	r := gin.Default()
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	
	r.POST("/eval", func(c *gin.Context) {
		var req EvalRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		prog := &lang.Program{}
		
		// Facts parsen
		for _, f := range req.Facts {
			stmt, err := lang.Parse(f)
			if err != nil {
				c.JSON(400, gin.H{"error": "fact parse: " + err.Error()})
				return
			}
			prog.Statements = append(prog.Statements, stmt)
		}
		
		// Rules parsen
		for _, rrule := range req.Rules {
			stmt, err := lang.Parse(rrule)
			if err != nil {
				c.JSON(400, gin.H{"error": "rule parse: " + err.Error()})
				return
			}
			prog.Statements = append(prog.Statements, stmt)
		}
		
		// Query parsen
		goal, err := lang.ParseGoal(req.Query)
		if err != nil {
			c.JSON(400, gin.H{"error": "query parse: " + err.Error()})
			return
		}

		eng := engine.NewSemiNaiveEngine()
		res, err := eng.Query(prog, goal)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"answers": res.String()})
	})

	r.Run(":9090")
} 