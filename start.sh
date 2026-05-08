#!/bin/bash
cd /home/z/my-project
NODE_ENV=production
exec node .next/standalone/server.js
