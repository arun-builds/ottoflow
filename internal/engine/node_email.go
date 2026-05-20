package engine

import (
	"fmt"
	"log"
)

type EmailNodeHandler struct{}

func (h *EmailNodeHandler) Handle(nc NodeContext) NodeResult {
	// 1. Get raw config from the node data
	rawTo := fmt.Sprintf("%v", nc.Node.Data["to"])
	rawSubject := fmt.Sprintf("%v", nc.Node.Data["subject"])
	rawBody := fmt.Sprintf("%v", nc.Node.Data["body"])

	// 2. Resolve dynamic variables (e.g. {{webhook.repository.name}})
	to := resolveString(rawTo, nc.State)
	subject := resolveString(rawSubject, nc.State)
	body := resolveString(rawBody, nc.State)

	// 3. Load SMTP config from Worker environment variables
	// smtpHost := os.Getenv("SMTP_HOST") // e.g., smtp.gmail.com
	// smtpPort := os.Getenv("SMTP_PORT") // e.g., 587
	// smtpUser := os.Getenv("SMTP_USER") // e.g., your email
	// smtpPass := os.Getenv("SMTP_PASS") // e.g., your app password

	// if smtpHost == "" || smtpUser == "" {
	// 	return NodeResult{Error: fmt.Errorf("SMTP credentials not configured in worker environment")}
	// }

	// auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	// Build the email message
	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	log.Println("email sent ", msg)

	// 4. Send it!
	// err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpUser, []string{to}, msg)
	// if err != nil {
	// 	return NodeResult{Error: fmt.Errorf("failed to send email: %w", err)}
	// }

	// 5. Return success data to be logged in Postgres
	return NodeResult{
		ActiveHandle: "main",
		Output: map[string]interface{}{
			"sent_to": to,
			"subject": subject,
		},
	}
}
