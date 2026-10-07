import json
from pathlib import PurePosixPath
from urllib.parse import quote

import boto3
import os
import uuid
import time

PREFIX = "homepage/images/"
MANIFEST = "homepage/manifest.json"
DEPARTMENTS = ("newborn", "men", "women", "kids", "footwear")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}


def image_url(obj):
    return "/" + quote(obj["Key"], safe="/") + "?v=" + quote(obj.get("ETag", "").strip('"'), safe="")


def build_manifest(objects):
    files = {}
    for obj in objects:
        key = obj["Key"]
        if key.startswith(PREFIX) and obj.get("Size", 0) > 0 and PurePosixPath(key).suffix.lower() in EXTENSIONS:
            files[key] = obj
    banners = []
    categories = {}
    for department in DEPARTMENTS:
        banner_prefix = PREFIX + "banners/" + department + "/"
        images = sorted((obj for key, obj in files.items()
                         if key.startswith(banner_prefix) and "/" not in key[len(banner_prefix):]),
                        key=lambda obj: obj["Key"])
        # Preserve grouped campaign images, with additional groups becoming slides.
        for offset in range(0, len(images), 3):
            group = images[offset:offset + 3]
            mobile = []
            for obj in group:
                mobile_key = PREFIX + "mobile/" + department + "/" + PurePosixPath(obj["Key"]).name
                mobile.append(image_url(files.get(mobile_key, obj)))
            banners.append({"department": department, "images": [image_url(obj) for obj in group], "mobileImages": mobile})
        category_prefix = PREFIX + "categories/" + department + "/"
        candidates = sorted(key for key in files if key.startswith(category_prefix) and "/" not in key[len(category_prefix):])
        if candidates:
            categories[department] = image_url(files[candidates[0]])
    return {"version": 1, "banners": banners, "categories": categories}


def handler(event, context):
    bucket = os.environ["BUCKET"]
    s3 = boto3.client("s3")
    for attempt in range(5):
        current = next((obj for obj in s3.list_objects_v2(Bucket=bucket, Prefix=MANIFEST).get("Contents", [])
                        if obj["Key"] == MANIFEST), None)
        condition = {"IfMatch": current["ETag"]} if current else {"IfNoneMatch": "*"}
        pages = s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix=PREFIX)
        manifest = build_manifest(obj for page in pages for obj in page.get("Contents", []))
        # A fresh revision prevents concurrent listings from overwriting newer results.
        manifest["revision"] = str(uuid.uuid4())
        try:
            s3.put_object(Bucket=bucket, Key=MANIFEST, Body=json.dumps(manifest).encode(),
                          ContentType="application/json", CacheControl="no-cache, max-age=0, must-revalidate", **condition)
            return {"slides": len(manifest["banners"]), "categories": len(manifest["categories"])}
        except Exception as error:
            status = getattr(error, "response", {}).get("ResponseMetadata", {}).get("HTTPStatusCode")
            if status not in (409, 412) or attempt == 4:
                raise
            time.sleep(0.2 * (attempt + 1))
