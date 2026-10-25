package engine

import (
	"fmt"
	"log/slog"
	"net/smtp"
	"os"
)

type EmailNodeHandler struct{}

func (h *EmailNodeHandler) Handle(nc NodeContext) NodeResult {
	// 1. Get raw config from the node data
	rawTo := stringData(nc.Node.Data, "to")
	rawSubject := stringData(nc.Node.Data, "subject")
	rawBody := stringData(nc.Node.Data, "body")

	// 2. Resolve dynamic variables (e.g., {{webhook.repository.name}})
	to := resolveString(rawTo, nc.State)
	subject := resolveString(rawSubject, nc.State)
	body := resolveString(rawBody, nc.State)

	if to == "" {
		return NodeResult{Error: fmt.Errorf("email node requires a 'to' address")}
	}

	// 3. Load SMTP config from Worker environment variables
	smtpHost := os.Getenv("SMTP_HOST") // e.g., smtp.gmail.com
	smtpPort := os.Getenv("SMTP_PORT") // e.g., 587
	smtpUser := os.Getenv("SMTP_USER") // e.g., your email
	smtpPass := os.Getenv("SMTP_PASS") // e.g., your app password
	smtpFrom := os.Getenv("SMTP_FROM")
	if smtpPort == "" {
		smtpPort = "587"
	}
	if smtpFrom == "" {
		smtpFrom = smtpUser
	}

	// Build the email message
	msg := []byte("From: " + smtpFrom + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=\"utf-8\"\r\n" +
		"\r\n" +
		body + "\r\n")

	// 4. Send it (or simulate it if SMTP is not configured locally)
	if smtpHost == "" || smtpUser == "" {
		slog.Warn("SMTP not configured, skipping email send",
			slog.String("node_id", nc.Node.ID),
			slog.String("to", to),
			slog.String("subject", subject),
		)
	} else {
		auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
		if err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpFrom, []string{to}, msg); err != nil {
			return NodeResult{Error: fmt.Errorf("failed to send email: %w", err)}
		}
		slog.Info("Email sent",
			slog.String("node_id", nc.Node.ID),
			slog.String("to", to),
		)
	}

	// 5. Return success data to be logged in Postgres
	return NodeResult{
		ActiveHandle: "main",
		Output: map[string]interface{}{
			"sent_to": to,
			"subject": subject,
		},
	}
}
