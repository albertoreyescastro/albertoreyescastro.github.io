from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"


class PortfolioParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.blank_links_without_rel: list[str] = []
        self.meta: dict[tuple[str, str], str] = {}
        self.canonical: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value for key, value in attrs if value is not None}

        if "id" in data:
            self.ids.append(data["id"])

        if tag == "a" and "href" in data:
            href = data["href"]
            self.refs.append(("href", href))
            if data.get("target") == "_blank":
                rel = set((data.get("rel") or "").split())
                if not {"noopener", "noreferrer"}.issubset(rel):
                    self.blank_links_without_rel.append(href)

        if tag in {"img", "script"} and "src" in data:
            self.refs.append(("src", data["src"]))

        if tag == "link" and "href" in data:
            self.refs.append(("href", data["href"]))
            if data.get("rel") == "canonical":
                self.canonical = data["href"]

        if tag == "meta" and "content" in data:
            if "name" in data:
                self.meta[("name", data["name"])] = data["content"]
            if "property" in data:
                self.meta[("property", data["property"])] = data["content"]


def local_path(ref: str) -> Path | None:
    if ref.startswith(("mailto:", "tel:", "#")):
        return None

    parts = urlsplit(ref)
    if parts.scheme or parts.netloc:
        return None

    path = parts.path
    if not path:
        return None

    if path.startswith("/"):
        candidate = ROOT / path.lstrip("/")
    else:
        candidate = ROOT / path.removeprefix("./")
    return candidate


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    parser = PortfolioParser()
    parser.feed(html)

    errors: list[str] = []

    duplicate_ids = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicate_ids:
        errors.append(f"duplicate HTML ids: {duplicate_ids}")

    missing: list[str] = []
    for _, ref in parser.refs:
        candidate = local_path(ref)
        if candidate is not None and not candidate.exists():
            missing.append(ref)
    if missing:
        errors.append(f"missing local references: {sorted(set(missing))}")

    if parser.blank_links_without_rel:
        errors.append(
            "target=_blank links missing rel=noopener noreferrer: "
            + repr(sorted(set(parser.blank_links_without_rel)))
        )

    required_meta = [
        ("name", "description"),
        ("name", "robots"),
        ("property", "og:title"),
        ("property", "og:description"),
        ("property", "og:url"),
        ("property", "og:image"),
    ]
    missing_meta = [key for key in required_meta if not parser.meta.get(key)]
    if missing_meta:
        errors.append(f"missing required metadata: {missing_meta}")

    if parser.canonical != "https://albertoreyescastro.github.io/":
        errors.append(f"unexpected canonical URL: {parser.canonical!r}")

    required_files = [ROOT / "robots.txt", ROOT / "sitemap.xml", ROOT / "assets" / "styles.css"]
    absent_required = [str(path.relative_to(ROOT)) for path in required_files if not path.exists()]
    if absent_required:
        errors.append(f"missing required site files: {absent_required}")

    retired = [
        "assets/reports/modelhawk-sample-audit-report.pdf",
        "assets/reports/aiot_smart_home_public_report.pdf",
        "assets/reports/credit-card-fraud-detection-report.pdf",
    ]
    stale = [item for item in retired if item in html]
    if stale:
        errors.append(f"retired portfolio-local report references remain: {stale}")

    if errors:
        raise SystemExit("Site validation failed:\n- " + "\n- ".join(errors))

    print(
        f"PASS: {len(parser.refs)} references, {len(parser.ids)} unique ids, "
        "required metadata and internal assets validated."
    )


if __name__ == "__main__":
    main()
