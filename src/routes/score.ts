import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit'
import { validator } from 'hono/validator'
import { md5 } from 'hono/utils/crypto';
import { Reader } from 'bms';
import { compile } from '../utils/bmscompiler';
import { ensureBmsFile } from '../utils/bmsutils';
import { Chart } from '../models/chart';
import { Buffer } from 'node:buffer';
import { Bindings } from '../types';
import { encodeBase64 } from 'hono/utils/encode';
import { cache } from 'hono/cache'

const app = new Hono<{
    Bindings: Bindings
  }>();

app.get('/get', cache({
    cacheName: 'bms-score-viewer-get',
    cacheControl: 'max-age=3600',
  }), async (c) => {
    if (c.req.query("md5") === undefined) {
        return c.json({ "status": "Invalid request" }, 400);
    }
    let md5regex = /^[a-fA-F0-9]+$/;
    let md5 = c.req.query("md5") as string;
    if (md5.length !== 32 || !md5regex.test(md5))
        return c.json({ "status": "Invalid request" }, 400);
    else {
        const result = await c.env.DB.prepare(
            "SELECT keys FROM Charts WHERE md5 = ?"
          )
            .bind(md5)
            .first();
        if (!result)
            return c.json({ "status": "Not found" }, 404);
        const object = await c.env.SCORE_BUCKET.get(md5);
        if (!object)
            return c.json({ "status": "Not found" }, 404);
        c.header("Etag", object.httpEtag);
        return c.json({ "keys": result["keys"], "data": encodeBase64(await object.arrayBuffer()) });
    }
});

app.get('/status', async (c) => {
    if (c.req.query("md5") === undefined) {
        return c.json({ "status": "Invalid request" }, 400);
    }
    let md5regex = /^[a-fA-F0-9]+$/;
    let md5 = c.req.query("md5") as string;
    if (md5.length !== 32 || !md5regex.test(md5))
        return c.json({ "status": "Invalid request" }, 400);
    else {
        const { results } = await c.env.DB.prepare(
            "SELECT * FROM Charts WHERE md5 = ?"
          )
            .bind(md5)
            .all();
        return c.json({ "status": results.length > 0 ? "OK" : "Not found" });
    }
});

app.post('/register', bodyLimit({
    maxSize: 5 * 1024000, // 5M
    onError: (c) => {
        return c.json({ "status": 'File too large' }, 413);
    },
}),
    validator("form", ensureBmsFile), async (c) => {
        const body = await c.req.parseBody();
        if (body["file"] === undefined)
            return c.json({ "status": "Invalid request" }, 400);
        else {
            const file = body["file"] as File;
            const fileArr = await file.arrayBuffer();
            let bmsStr = Reader.read(Buffer.from(fileArr), {forceEncoding: "SJIS"});
            let chart = compile(bmsStr);
            if (chart.headerSentences === 0 && chart.channelSentences === 0) // Not a BMS file
                return c.json({ "status": "Uploaded file is not a BMS" }, 400);
            let computedMd5 = await md5(fileArr);
            if (!computedMd5)
                return c.json({ "status": "Internal error" }, 500);
            const chartObj = new Chart(chart.chart, chart.objectMap, computedMd5, file.name);

            // Upload chart to R2
            await c.env.SCORE_BUCKET.put(computedMd5, fileArr);

            // Add chartObj to DB
            try {
                await c.env.DB.prepare(
                    "INSERT INTO Charts (md5, title, artist, keys, bpm, notes, date, filename) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
                ).bind(chartObj.md5, chartObj.title, chartObj.artist, chartObj.keys, chartObj.bpm, chartObj.notes, chartObj.date.getTime(), chartObj.filename).run();
            } catch (e) {
                return c.json({ "status": "Chart already in database" }, 400);
            }

            return c.json({ "status": "OK", "md5": computedMd5 });
        };
    }
);

app.get('/query', cache({
    cacheName: 'bms-score-viewer-query',
    cacheControl: 'max-age=3600',
  }), async (c) => {
    let query = c.env.DB.prepare("SELECT * FROM Charts ORDER BY date DESC");
    if (c.req.query("q") !== undefined && c.req.query("q")?.length !== 0) {
        query = c.env.DB.prepare("SELECT * FROM Charts WHERE title LIKE ?1 OR artist LIKE ?1 ORDER BY date DESC LIMIT 100").bind("%" + c.req.query("q") + "%");
    }
    const { results } = await query.all();
    return c.json(results);
});

export default app;
