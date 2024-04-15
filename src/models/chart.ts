import { BMSChart, BMSObject } from "bms";

export class Chart {
    title: string;
    artist: string;
    keys: number;
    bpm: number;
    notes: number;
    date: Date;
    md5: string;
    filename: string;

    private getTitle(chart: BMSChart): string {
        let title = chart.headers.get("title");
        if (title === undefined)
            title = "";
        const subtitle = chart.headers.get("subtitle");
        if (subtitle === undefined)
            return title;
        return title + (title && subtitle ? " ": "") + subtitle;
    }

    private getArtist(chart: BMSChart): string {
        let artist = chart.headers.get("artist");
        if (artist === undefined)
            artist = "";
        const subartist = chart.headers.get("subartist");
        if (subartist === undefined)
            return artist;
        return artist + (artist && subartist ? " ": "") + subartist;
    }

    private getKeys(chart: BMSChart, objects: BMSObject[], filename: string): number {
        if (filename.toLowerCase().endsWith(".pms"))
            return 9;

        let sp5 = false;
        let sp7 = false;
        let dp10 = false;
        let dp14 = false;

        for (const x of objects) {
            let channel = x.channel.toLowerCase();
            if (channel.match(/[246e][8-9]/))
                dp14 = true;
            else if (channel.match(/[246e][1-7]/))
                dp10 = true;
            else if (channel.match(/[135d][8-9]/))
                sp7 = true;
            else if (channel.match(/[135d][1-7]/))
                sp5 = true;
        }

        if (dp14 || (sp7 && dp10))
            return 14;
        else if (dp10)
            return 10;
        else if (sp7)
            return 7;
        else if (sp5)
            return 5;
        return 7;
    }

    private getBPM(chart: BMSChart): number {
        const bpm = chart.headers.get("bpm");
        if (bpm === undefined)
            return 0;
        return parseFloat(bpm);
    }

    private getNotes(chart: BMSChart, objects: BMSObject[]): number {
        const lnobj = chart.headers.get("lnobj");
        let lntype = chart.headers.get("lntype");
        if (lnobj === undefined && lntype === undefined)
            lntype = "1"
        return Math.floor(objects.filter(x => x.channel.match(/^[12][1-9]$/) && x.value !== lnobj).length + objects.filter(x => lntype === "1" && x.channel.match(/^[56][1-9]$/)).length / 2);
    }

    constructor(chart: BMSChart, objectMap: Map<string, BMSObject>, md5: string, filename: string) {
        const objects = Array.from(objectMap.values());
        this.title = this.getTitle(chart);
        this.artist = this.getArtist(chart);
        this.keys = this.getKeys(chart, objects, filename);
        this.bpm = this.getBPM(chart);
        this.notes = this.getNotes(chart, objects);
        this.date = new Date();
        this.md5 = md5;
        this.filename = filename;
    }
  }