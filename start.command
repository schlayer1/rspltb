#!/bin/bash
cd "$(dirname "$0")"
echo "=========================================================="
echo "  LTB-Auswerter: Reflexion schulischer Praxis (Uni Jena)  "
echo "=========================================================="
echo "Starte lokalen Server..."
open "http://localhost:5173"
npm run dev
