package queue

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type WebhookConsumer struct {
	client   *redis.Client
	stream   string
	group    string
	consumer string
}

func NewWebhookConsumer(redisURL string) (*WebhookConsumer, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opt)

	stream := "ottoflow:webhooks"
	group := "worker-group"

	// Create the consumer group. MkStream creates the stream if it doesn't exist yet.
	err = client.XGroupCreateMkStream(context.Background(), stream, group, "0").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		return nil, fmt.Errorf("failed to create consumer group: %w", err)
	}

	return &WebhookConsumer{
		client:   client,
		stream:   stream,
		group:    group,
		consumer: "worker-1", // In production, this could be os.Hostname() or a UUID
	}, nil
}

// Start polling Redis for new webhooks
func (c *WebhookConsumer) Consume(ctx context.Context, handler func(webhookID, payload, messageID string) error) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			// Block for 2 seconds waiting for new messages (">" means messages never delivered to other consumers)
			streams, err := c.client.XReadGroup(ctx, &redis.XReadGroupArgs{
				Group:    c.group,
				Consumer: c.consumer,
				Streams:  []string{c.stream, ">"},
				Count:    1,
				Block:    2 * time.Second,
			}).Result()

			if err != nil {
				if err != redis.Nil { // redis.Nil just means timeout, which is normal
					slog.Error("Error reading from stream", slog.String("error", err.Error()))
					time.Sleep(1 * time.Second) // Backoff on error
				}
				continue
			}

			for _, msg := range streams[0].Messages {
				webhookID := msg.Values["webhook_id"].(string)
				payload := msg.Values["payload"].(string)

				// 1. Process the message
				err := handler(webhookID, payload, msg.ID)

				// 2. Acknowledge the message so it isn't processed again
				if err == nil {
					c.client.XAck(ctx, c.stream, c.group, msg.ID)
					slog.Info("Successfully processed and ACKed webhook", slog.String("msg_id", msg.ID))
				} else {
					slog.Error("Failed to process webhook", slog.String("error", err.Error()))
					// Note: In a robust system, you'd eventually route failed ACKs to a Dead Letter Queue
				}
			}
		}
	}
}

func (c *WebhookConsumer) Close() error {
	return c.client.Close()
}
