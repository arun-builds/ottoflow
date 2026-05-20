# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Download dependencies first (caches this layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code
COPY . .

# Build the specific service passed via build arg
ARG SERVICE_NAME
RUN go build -o /bin/service ./cmd/${SERVICE_NAME}

# Run stage (Ultra-lightweight alpine image)
FROM alpine:latest
WORKDIR /root/

# Copy the compiled binary from the builder
COPY --from=builder /bin/service .

CMD ["./service"]