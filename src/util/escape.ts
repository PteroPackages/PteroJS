/**
 * Escapes (or removes) all the ASCII color and control codes from the given string. This is useful
 * for cleaning logs from a server webssocket output.
 * @param input The string to escape.
 * @returns The escaped string.
 */
export default function (input: string): string {
    return input.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
    );
}
