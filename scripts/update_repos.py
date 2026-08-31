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
CONTRIB_URL = "https://github.com/users/CuWO4/contributions"
CONTRIB_OUT = "data/contributions.svg"
CONTRIB_LEVEL_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"]
CONTRIB_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


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


def request_html(url):
    req = urllib.request.Request(url, headers={
        "Accept": "text/html",
        "User-Agent": "CuWO4.github.io-updater",
    })
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")


def parse_contributions(html):
    cells = {}
    id_re = re.compile(r"contribution-day-component-(\d+)-(\d+)")
    for td in re.findall(r"<td[^>]*>", html):
        idm = id_re.search(td)
        dm = re.search(r'data-date="([^"]+)"', td)
        lm = re.search(r'data-level="(\d)"', td)
        if idm and dm and lm:
            row, col = int(idm.group(1)), int(idm.group(2))
            cells[(row, col)] = (dm.group(1), int(lm.group(1)))
    return cells


def render_contributions_svg(cells):
    if not cells:
        return ""
    rows = max(r for r, _ in cells) + 1
    cols = max(c for _, c in cells) + 1
    cell = 11
    gap = 4
    label_h = 22
    width = cols * (cell + gap) - gap
    height = label_h + rows * (cell + gap) - gap

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"'
        f' viewBox="0 0 {width} {height}" role="img" aria-label="contribution graph">'
    ]

    last_month = None
    for col in range(cols):
        month = None
        for (r, c), (date, _) in sorted(cells.items()):
            if c == col:
                month = int(date[5:7])
                break
        if month is not None and month != last_month:
            x = col * (cell + gap)
            parts.append(
                f'<text x="{x}" y="{label_h - 8}" font-size="11" fill="#8b949e">'
                f'{CONTRIB_MONTHS[month - 1]}</text>'
            )
            last_month = month

    for (row, col), (_, level) in sorted(cells.items(), key=lambda kv: (kv[0][1], kv[0][0])):
        x = col * (cell + gap)
        y = label_h + row * (cell + gap)
        parts.append(
            f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="2" '
            f'fill="{CONTRIB_LEVEL_COLORS[level]}"/>'
        )

    parts.append("</svg>")
    return "".join(parts)


def generate_contributions():
    html = request_html(CONTRIB_URL)
    svg = render_contributions_svg(parse_contributions(html))
    if not svg:
        raise RuntimeError("no contribution cells parsed")
    os.makedirs(os.path.dirname(CONTRIB_OUT), exist_ok=True)
    with open(CONTRIB_OUT, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"wrote {CONTRIB_OUT}")


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

    generate_contributions()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
