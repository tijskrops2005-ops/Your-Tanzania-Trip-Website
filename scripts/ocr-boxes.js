// JXA (macOS): osascript -l JavaScript scripts/ocr-boxes.js <listfile> <outfile.json>
// Apple Vision text recognition with normalised bounding boxes (origin bottom-left) for every image
// path in <listfile>; the image is read whole, in quadrants and in 3x3 and 4x4 tiles. Used by scripts/debrand.py.
ObjC.import('Foundation');
ObjC.import('Vision');

function run(argv) {
  const list = $.NSString.stringWithContentsOfFileEncodingError(argv[0], $.NSUTF8StringEncoding, null).js.split('\n').filter(Boolean);
  const opts = $.NSDictionary.dictionary;
  const result = {};
  function recognise(url, roi) {
    const req = $.VNRecognizeTextRequest.alloc.init;
    req.recognitionLevel = 0;
    req.usesLanguageCorrection = false;
    if (roi) req.regionOfInterest = $.NSMakeRect(roi[0], roi[1], roi[2], roi[3]);
    $.VNImageRequestHandler.alloc.initWithURLOptions(url, opts).performRequestsError($([req]), null);
    const out = [];
    const res = req.results;
    if (!res || res.isNil()) return out;
    for (let i = 0; i < res.count; i++) {
      const o = res.objectAtIndex(i);
      const c = o.topCandidates(1);
      if (!c.count) continue;
      const b = o.boundingBox;
      let x = b.origin.x, y = b.origin.y, w = b.size.width, h = b.size.height;
      if (roi) { x = roi[0] + x * roi[2]; y = roi[1] + y * roi[3]; w *= roi[2]; h *= roi[3]; }
      out.push({ t: c.objectAtIndex(0).string.js, x, y, w, h });
    }
    return out;
  }
  for (const path of list) {
    const url = $.NSURL.fileURLWithPath(path);
    let obs = recognise(url, null);
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) obs = obs.concat(recognise(url, [tx * 0.5, ty * 0.5, 0.5, 0.5]));
    for (const n of [3, 4]) for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) obs = obs.concat(recognise(url, [tx / n, ty / n, 1 / n, 1 / n]));
    result[path] = obs;
  }
  $.NSString.stringWithString(JSON.stringify(result)).writeToFileAtomicallyEncodingError(argv[1], true, $.NSUTF8StringEncoding, null);
  return 'ok ' + list.length;
}
