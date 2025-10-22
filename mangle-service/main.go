package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/eval", evalHandler)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})
	log.Println("Mangle service on :8088")
	log.Fatal(http.ListenAndServe(":8088", nil))
} 