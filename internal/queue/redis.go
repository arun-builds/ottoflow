package queue

import (
	"context"

	"github.com/redis/go-redis/v9"
)

type WebhookPublisher struct {
	client *redis.Client
}

func NewWebhookPublisher(redisURL string) (*WebhookPublisher, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	return &WebhookPublisher{client: redis.NewClient(opt)}, nil
}

func (p *WebhookPublisher) Publish(ctx context.Context, webhookID string, payload []byte) error {
	return p.client.XAdd(ctx, &redis.XAddArgs{
		Stream: "ottoflow:webhooks",
		Values: map[string]interface{}{
			"webhook_id": webhookID,
			"payload":    string(payload),
		},
	}).Err()
}

func (p *WebhookPublisher) Close() error {
	return p.client.Close()
}
