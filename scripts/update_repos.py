#!/usr/bin/env python3
"""Fetch public repo metadata for CuWO4 and write data/repos.json."""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

OWNER = "CuWO4"
API = "https://api.github.com"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
OUT = "data/repos.json"


def request(path):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "CuWO4.github.io-updater",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(API + path, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.load(resp), dict(resp.headers)


def count_commits(full_name):
    body, headers = request(f"/repos/{full_name}/commits?per_page=1")
    link = headers.get("Link", "")
    for part in link.split(","):
        if 'rel="last"' in part:
            m = re.search(r"[?&]page=(\d+)", part)
            if m:
                return int(m.group(1))
    return len(body)


def main():
    repos = []
    page = 1
    while True:
        batch, _ = request(f"/users/{OWNER}/repos?per_page=100&page={page}")
        repos.extend(batch)
        if len(batch) < 100:
            break
        page += 1

    cards = []
    for repo in repos:
        try:
            commits = count_commits(repo["full_name"])
        except Exception as exc:
            print(f"warning: commit count failed for {repo['full_name']}: {exc}", file=sys.stderr)
            commits = 0
        cards.append({
            "name": repo["name"],
            "full_name": repo["full_name"],
            "description": repo["description"],
            "language": repo["language"],
            "html_url": repo["html_url"],
            "stargazers_count": repo["stargazers_count"],
            "commits": commits,
            "updated_at": repo["updated_at"],
        })

    cards.sort(key=lambda c: c["stargazers_count"], reverse=True)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repos": cards,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"wrote {OUT} with {len(cards)} repos")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
