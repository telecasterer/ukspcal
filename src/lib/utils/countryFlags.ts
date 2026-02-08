import frFlag from "flag-icons/flags/1x1/fr.svg";
import deFlag from "flag-icons/flags/1x1/de.svg";
import esFlag from "flag-icons/flags/1x1/es.svg";
import itFlag from "flag-icons/flags/1x1/it.svg";
import nlFlag from "flag-icons/flags/1x1/nl.svg";
import beFlag from "flag-icons/flags/1x1/be.svg";
import atFlag from "flag-icons/flags/1x1/at.svg";
import ptFlag from "flag-icons/flags/1x1/pt.svg";
import ieFlag from "flag-icons/flags/1x1/ie.svg";
import seFlag from "flag-icons/flags/1x1/se.svg";
import dkFlag from "flag-icons/flags/1x1/dk.svg";
import noFlag from "flag-icons/flags/1x1/no.svg";
import chFlag from "flag-icons/flags/1x1/ch.svg";
import usFlag from "flag-icons/flags/1x1/us.svg";
import caFlag from "flag-icons/flags/1x1/ca.svg";
import auFlag from "flag-icons/flags/1x1/au.svg";
import nzFlag from "flag-icons/flags/1x1/nz.svg";
import jpFlag from "flag-icons/flags/1x1/jp.svg";

/**
 * Country code to flag SVG mapping
 */
export const countryCodeToFlagSvg: Record<string, string> = {
    FR: frFlag,
    DE: deFlag,
    ES: esFlag,
    IT: itFlag,
    NL: nlFlag,
    BE: beFlag,
    AT: atFlag,
    PT: ptFlag,
    IE: ieFlag,
    SE: seFlag,
    DK: dkFlag,
    NO: noFlag,
    CH: chFlag,
    US: usFlag,
    CA: caFlag,
    AU: auFlag,
    NZ: nzFlag,
    JP: jpFlag,
};

/**
 * Get flag SVG URL for a country code
 */
export function getFlagSvg(countryCode: string): string {
    return countryCodeToFlagSvg[countryCode] || "";
}
