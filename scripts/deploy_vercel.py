import urllib.request
import urllib.error
import json
import subprocess
import os

vercel_token = "process.env.VERCEL_TOKEN"
project_name = "pari-tower-utsav-samiti"
turso_url = "libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io"
turso_token = "process.env.TURSO_AUTH_TOKEN"
session_secret = "pari_tower_utsav_samiti_production_secret_key_2026_festivals"

headers = {
    "Authorization": f"Bearer {vercel_token}",
    "Content-Type": "application/json",
    "User-Agent": "PTFC-Deployer"
}

# 1. Create or verify Project on Vercel
create_project_url = "https://api.vercel.com/v9/projects"
project_payload = {
    "name": project_name,
    "framework": "nextjs",
    "environmentVariables": [
        {
            "key": "TURSO_DATABASE_URL",
            "value": turso_url,
            "type": "plain",
            "target": ["production", "preview", "development"]
        },
        {
            "key": "TURSO_AUTH_TOKEN",
            "value": turso_token,
            "type": "encrypted",
            "target": ["production", "preview", "development"]
        },
        {
            "key": "SESSION_SECRET",
            "value": session_secret,
            "type": "encrypted",
            "target": ["production", "preview", "development"]
        }
    ]
}

req = urllib.request.Request(create_project_url, data=json.dumps(project_payload).encode("utf-8"), headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        res_json = json.loads(resp.read().decode("utf-8"))
        print("Project created on Vercel:", res_json.get("id"))
except urllib.error.HTTPError as e:
    err_body = e.read().decode("utf-8")
    if e.code == 409 or "already exists" in err_body.lower():
        print(f"Project '{project_name}' already exists on Vercel.")
    else:
        print(f"Project creation status {e.code}: {err_body}")

# 2. Deploy via Vercel CLI
print("Deploying directly to production via Vercel CLI...")
cmd = f'npx --yes vercel --prod --yes --name {project_name} --token {vercel_token}'
proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=r"D:\PariTower-UtsavSamiti")
print("Vercel stdout:", proc.stdout)
print("Vercel stderr:", proc.stderr)