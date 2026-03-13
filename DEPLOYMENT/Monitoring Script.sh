#!/bin/bash
# monitor.sh - Health monitoring script

send_alert() {
    local message=$1
    local severity=$2
    
    echo "[$severity] $message"
    
    # Send to Slack
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[$severity] $message\"}" \
            $SLACK_WEBHOOK
    fi
    
    # Send to PagerDuty (if critical)
    if [ "$severity" = "CRITICAL" ] && [ -n "$PAGERDUTY_KEY" ]; then
        curl -X POST -H "Content-type: application/json" \
            --data "{\"routing_key\":\"$PAGERDUTY_KEY\",\"event_action\":\"trigger\",\"payload\":{\"summary\":\"$message\",\"source\":\"monitor.sh\",\"severity\":\"critical\"}}" \
            "https://events.pagerduty.com/v2/enqueue"
    fi
}

# Check Docker services
check_docker_services() {
    local unhealthy=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")
    
    if [ -n "$unhealthy" ]; then
        send_alert "Unhealthy containers: $unhealthy" "CRITICAL"
    fi
}

# Check disk usage
check_disk_usage() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $usage -gt 90 ]; then
        send_alert "Disk usage critical: $usage%" "CRITICAL"
    elif [ $usage -gt 80 ]; then
        send_alert "Disk usage warning: $usage%" "WARNING"
    fi
}

# Check memory usage
check_memory_usage() {
    local total=$(free -m | awk 'NR==2 {print $2}')
    local used=$(free -m | awk 'NR==2 {print $3}')
    local usage=$((used * 100 / total))
    
    if [ $usage -gt 90 ]; then
        send_alert "Memory usage critical: $usage%" "CRITICAL"
    elif [ $usage -gt 80 ]; then
        send_alert "Memory usage warning: $usage%" "WARNING"
    fi
}

# Check CPU load
check_cpu_load() {
    local load=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | tr -d ' ')
    local cores=$(nproc)
    local threshold=$((cores * 2))
    
    if (( $(echo "$load > $threshold" | bc -l) )); then
        send_alert "CPU load critical: $load (threshold: $threshold)" "CRITICAL"
    fi
}

# Check API endpoints
check_api_endpoints() {
    local endpoints=(
        "https://api.moxe.com/health"
        "https://api.moxe.com/metrics"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -s -f -o /dev/null "$endpoint"; then
            send_alert "API endpoint down: $endpoint" "CRITICAL"
        fi
    done
}

# Check SSL certificates
check_ssl_certificates() {
    local domains=(
        "moxe.com"
        "api.moxe.com"
    )
    
    for domain in "${domains[@]}"; do
        local expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s)
        local now_epoch=$(date +%s)
        local days_left=$(( ($expiry_epoch - $now_epoch) / 86400 ))
        
        if [ $days_left -lt 7 ]; then
            send_alert "SSL certificate for $domain expires in $days_left days" "WARNING"
        fi
    done
}

# Main monitoring loop
while true; do
    echo "🔍 Running health checks at $(date)"
    
    check_docker_services
    check_disk_usage
    check_memory_usage
    check_cpu_load
    check_api_endpoints
    check_ssl_certificates
    
    echo "✅ Health checks completed"
    sleep 300 # Check every 5 minutes
done