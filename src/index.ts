import { load, type LoadOptions } from "js-yaml";
import fs from "node:fs";
import path from "node:path";

type DataProps = {
  lines: string[];
  metaIndices: number[];
};

type FrontMatterResult<T = Record<string, any>> = {
  /**
   *  Yaml data form a markdown files
   */
  data: T;
  /**
   * Body content of markdown file
   */
  content: string;
};

/**
 * Finds indices of lines in a markdown file that contain a metadata delimiter.
 * @param mem An array of indices to be populated.
 * @param item A line of the markdown file.
 * @param i The index of the line in the markdown file.
 * @returns The updated array of indices.
 */
function findMetaIndices(mem: number[], item: string, i: number): number[] {
  // If the line starts with ---, it's a metadata delimiter
  if (/^---/.test(item)) {
    // Add the index of the line to the array of indices
    mem.push(i);
  }

  return mem;
}
/**
 * Extracts and parses metadata from a markdown file.
 *
 * @param linesPros An object containing `lines` and `metaIndices` properties.
 * - `lines`: An array of strings representing lines of a markdown file.
 * - `metaIndices`: An array of numbers marking the start and end of the metadata block.
 *
 * @returns A JSON object containing the parsed metadata if present, otherwise an empty object.
 */
function getData<T = Record<string, any>>(linesPros: DataProps) {
  const { lines, metaIndices } = linesPros;
  if (metaIndices.length > 0) {
    const dat = lines.slice((metaIndices[0] as number) + 1, metaIndices[1]);
    const data = load(dat.join("\n"));
    return data as T;
  }
  return {} as T;
}
/**
 * Returns the content of a markdown file as a string, optionally
 * skipping over a metadata block.
 *
 * If the file contains a metadata block, the content will be
 * everything after the second `---` delimiter. Otherwise, the
 * content will be the entire file.
 *
 * @param linesPros An object with `lines` and `metaIndices` properties.
 * @returns A string containing the content of the markdown file.
 */
function getContent(linesPros: DataProps): string {
  const { lines, metaIndices } = linesPros;
  return metaIndices.length > 0
    ? lines.slice((metaIndices[0] as number) + 1).join("\n")
    : lines.join("\n");
}
/**
 * Parses markdown content into front matter data and body content.
 *
 * When the markdown begins with a YAML front matter block delimited by `---`,
 * the block is parsed with `js-yaml` and returned as `data`. The remaining
 * markdown body is returned as `content`.
 *
 * @typeParam T The expected shape of the parsed front matter object.
 * @param mdContent The raw markdown document to parse.
 * @returns An object containing the parsed front matter and markdown body.
 */
function frontmatter<T = Record<string, any>>(
  mdContent: string,
): FrontMatterResult<T> {
  var lines = mdContent.split("\n");
  var metaIndices = lines.reduce(findMetaIndices, []);
  var data = getData({ lines, metaIndices }) as T;
  var content = getContent({ lines, metaIndices });
  return { data, content };
}

async function loadYaml<T = Record<string, any>>(
  file: string,
  opts?: LoadOptions,
): Promise<T> {
  const filePath = path.resolve(process.cwd(), file);
  const yamlExts = [".yaml", ".yml"];
  if (fs.existsSync(filePath) && yamlExts.includes(path.extname(filePath))) {
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    return load(fileContent, opts) as T;
  }
  return {} as T;
}

export type { FrontMatterResult };
export { frontmatter, loadYaml };
