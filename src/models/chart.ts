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
        const title = chart.headers.get("title");
        if (title === undefined)
            return "";
        const subtitle = chart.headers.get("subtitle");
        if (subtitle === undefined)
            return title;
        return title + " " + subtitle;
    }

    private getArtist(chart: BMSChart): string {
        const artist = chart.headers.get("artist");
        if (artist === undefined)
            return "";
        const subartist = chart.headers.get("subartist");
        if (subartist === undefined)
            return artist;
        return artist + " " + subartist;
    }

    private getKeys(chart: BMSChart, objects: BMSObject[], filename: string): number {
        if (filename.toLowerCase().endsWith(".pms"))
            return 9;
        const player = chart.headers.get("player");
        if (player === "1") { // SP
            return objects.filter(x => x.channel.toLowerCase().match(/[135d][8-9]/)).length > 0 ? 7 : 5;
        } else if (player === "3") { // DP
            return objects.filter(x => x.channel.toLowerCase().match(/[1-6de][8-9]/)).length > 0 ? 14 : 10;
        } else {
            return 7;
        }
    }

    private getBPM(chart: BMSChart): number {
        const bpm = chart.headers.get("bpm");
        if (bpm === undefined)
            return 0;
        return parseFloat(bpm);
    }

    private getNotes(chart: BMSChart, objects: BMSObject[]): number {
        const lnobj = chart.headers.get("lnobj");
        const lntype = chart.headers.get("lntype");
        return objects.filter(x => x.channel.match(/^[12][1-9]$/) && x.value !== lnobj).length + objects.filter(x => lntype === "1" && x.channel.match(/^[56][1-9]$/)).length / 2;
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