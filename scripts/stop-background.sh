#!/bin/bash

echo "Stopping WhatsApp AI Task Manager background services..."

lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "All background processes stopped successfully."
