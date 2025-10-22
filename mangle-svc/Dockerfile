FROM golang:1.22 as build
WORKDIR /app
COPY . .
RUN go mod download && go build -o mangle-svc

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/mangle-svc .
EXPOSE 9090
ENTRYPOINT ["/app/mangle-svc"] 