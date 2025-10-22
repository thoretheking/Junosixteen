package main

import (
	"crypto/sha256"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type InfoResponse struct {
	Service   string    `json:"service"`
	Version   string    `json:"version"`
	Timestamp time.Time `json:"timestamp"`
	Uptime    string    `json:"uptime"`
	Rules     RulesInfo `json:"rules"`
}

type RulesInfo struct {
	Files []string `json:"files"`
	Hash  string   `json:"hash"`
	Count int      `json:"count"`
}

var startTime = time.Now()

func infoHandler(c *gin.Context) {
	// Calculate uptime
	uptime := time.Since(startTime)
	
	// Get rules info
	rulesInfo := getRulesInfo()
	
	response := InfoResponse{
		Service:   "junosixteen-mangle",
		Version:   getVersion(),
		Timestamp: time.Now(),
		Uptime:    uptime.String(),
		Rules:     rulesInfo,
	}
	
	c.JSON(http.StatusOK, response)
}

func versionHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"version": getVersion(),
		"rules_hash": getRulesHash(),
	})
}

func getVersion() string {
	// Try to read VERSION file
	if data, err := ioutil.ReadFile("VERSION"); err == nil {
		return string(data)
	}
	
	// Fallback to environment or default
	if version := os.Getenv("MANGLE_VERSION"); version != "" {
		return version
	}
	
	return "0.1.0-dev"
}

func getRulesInfo() RulesInfo {
	rulesDir := "rules"
	files := []string{}
	
	// Find all .dl files
	filepath.Walk(rulesDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && filepath.Ext(path) == ".dl" {
			files = append(files, path)
		}
		return nil
	})
	
	return RulesInfo{
		Files: files,
		Hash:  getRulesHash(),
		Count: len(files),
	}
}

func getRulesHash() string {
	// Create combined hash of all rule files
	hasher := sha256.New()
	
	rulesDir := "rules"
	filepath.Walk(rulesDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && filepath.Ext(path) == ".dl" {
			if data, err := ioutil.ReadFile(path); err == nil {
				hasher.Write(data)
			}
		}
		return nil
	})
	
	return fmt.Sprintf("%x", hasher.Sum(nil))[:16] // First 16 chars
} 