import json
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# The production SDK is supplied by Lambda; tests need no AWS credentials.
sys.modules.setdefault("boto3", MagicMock())
from handler import build_manifest, handler, PREFIX, MANIFEST


def obj(key, size=100, etag='"abc"'):
    return {"Key": PREFIX + key, "Size": size, "ETag": etag}


class ManifestTests(unittest.TestCase):
    def test_sorted_grouping_and_mobile_counterpart(self):
        files = [obj("banners/men/04.png"), obj("banners/men/02.png"), obj("banners/men/01.png"), obj("banners/men/03.png"), obj("mobile/men/01.png")]
        result = build_manifest(files)
        self.assertEqual([len(slide["images"]) for slide in result["banners"]], [3, 1])
        self.assertIn("/01.png", result["banners"][0]["images"][0])
        self.assertIn("/mobile/", result["banners"][0]["mobileImages"][0])
        self.assertEqual(result["banners"][0]["images"][1], result["banners"][0]["mobileImages"][1])

    def test_excludes_non_images_folders_and_unknown_departments(self):
        result = build_manifest([obj("banners/men/"), obj("banners/men/a.svg"), obj("banners/men/a.png", 0), obj("banners/secret/a.png"), obj("banners/men/nested/a.png")])
        self.assertEqual(result["banners"], [])

    def test_encodes_filenames_and_updates_revision_on_replace(self):
        first = build_manifest([obj("banners/women/a space.JPG")])["banners"][0]["images"][0]
        second = build_manifest([obj("banners/women/a space.JPG", etag='"new"')])["banners"][0]["images"][0]
        self.assertIn("a%20space.JPG?v=abc", first)
        self.assertNotEqual(first, second)

    def test_category_selects_first_filename_and_deletion_removes_slide(self):
        files = [obj("categories/kids/02.png"), obj("categories/kids/01.png"), obj("banners/kids/01.png")]
        result = build_manifest(files)
        self.assertIn("/01.png", result["categories"]["kids"])
        self.assertEqual(build_manifest(files[:-1])["banners"], [])

    @patch.dict(os.environ, {"BUCKET": "test-bucket"})
    @patch("handler.boto3.client")
    def test_paginates_and_writes_outside_event_prefix(self, client):
        s3 = client.return_value
        s3.list_objects_v2.return_value = {}
        s3.get_paginator.return_value.paginate.return_value = [{"Contents": [obj("banners/men/01.png")]}, {"Contents": [obj("banners/kids/01.png")]}]
        result = handler({}, None)
        self.assertEqual(result["slides"], 2)
        args = s3.put_object.call_args.kwargs
        self.assertEqual(args["Key"], MANIFEST)
        self.assertFalse(args["Key"].startswith(PREFIX))
        self.assertIn("no-cache", args["CacheControl"])
        self.assertEqual(json.loads(args["Body"])["version"], 1)
        self.assertEqual(args["IfNoneMatch"], "*")

    @patch.dict(os.environ, {"BUCKET": "test-bucket"})
    @patch("handler.time.sleep")
    @patch("handler.boto3.client")
    def test_concurrent_update_relists_before_retry(self, client, sleep):
        s3 = client.return_value
        s3.list_objects_v2.side_effect = [{"Contents": [{"Key": MANIFEST, "ETag": '"old"'}]}, {"Contents": [{"Key": MANIFEST, "ETag": '"new"'}]}]
        s3.get_paginator.return_value.paginate.return_value = [{"Contents": [obj("banners/men/01.png")]}]
        conflict = Exception("Another upload finished first")
        conflict.response = {"ResponseMetadata": {"HTTPStatusCode": 412}}
        s3.put_object.side_effect = [conflict, {}]
        handler({}, None)
        self.assertEqual(s3.get_paginator.return_value.paginate.call_count, 2)
        self.assertEqual(s3.put_object.call_args_list[0].kwargs["IfMatch"], '"old"')
        self.assertEqual(s3.put_object.call_args_list[1].kwargs["IfMatch"], '"new"')


if __name__ == "__main__":
    unittest.main()
