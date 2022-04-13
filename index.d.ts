/// <reference types="node" />

declare module 'sassdoc' {
  import { Duplex } from 'stream';
  import { EventEmitter } from 'events';
  import * as ScssCommentParser from 'scss-comment-parser';

  export = sassdoc;

  interface Stream extends Duplex {
    /**
     * Will be resolved when the stream is done and the data is fulfiled.
     */
    promise: Promise<void>;
  }

  /**
   * Default public promise-based API method
   */
  function sassdoc(path?: string | string[], options?: sassdoc.SassDocOptions): Promise<void>;

  /**
   * Default public API method for streams
   */
  function sassdoc(options?: sassdoc.SassDocOptions): Stream;

  module sassdoc {
    export class Logger {
      constructor(verbose?: boolean, debug?: boolean);
      /**
       * Log arguments into stderr if debug mode is enabled (will call all
       * argument functions to allow "lazy" arguments).
       */
      debug(...args: any[]): void;
      /**
       * Log arguments into stderr if the verbose mode is enabled.
       */
      log(...args: any[]): void;
      /**
       * Always log arguments as warning into stderr.
       */
      warn(...args: any[]): void;
      /**
       * Always log arguments as error into stderr.
       */
      error(...args: any[]): void;
      /**
       * Init a new timer.
       */
      time(label: string): void;
      /**
       * End timer and log result into stderr.
       */
      timeEnd(label: string, format?: string): void;
    }

    export interface EnvironmentConfiguration {
      /**
       * @default "false"
       */
       verbose?: boolean;
       /**
        * @default "false"
        */
       strict?: boolean;
    }

    export interface ThemeContext<T = unknown> {
      groups?: Record<string, string>;
      display?: {
        annotations?: Record<string, string[]>;
        access?: string[];
        alias?: boolean;
        watermark?: boolean;
      };
      data?: T;
      shortcutIcon?: {
        url: string;
        path: string;
        type?: 'internal' | string;
      };
    }

    export class Environment extends EventEmitter {
      constructor(logger: Logger, verbose?: boolean, strict?: boolean);

      logger: Logger;
      verbose: boolean;
      strict: boolean;

      theme?: string | ((dest: string, context: ThemeContext) => Promise<void>) | {
        /**
         * Allows for including comments not necessarily linked
         * to an item in final data.
         */
        includeUnknownContexts?: boolean;
        annotations?: Array<Annotation>;
      };

      themeName?: string;
      displayTheme?: string;

      file?: string;
      dir?: string;
      dest?: string;
      destCwd?: boolean;
      displayDest?: string;

      /**
       * Raw data from the project's `package.json`, or a JSON file
       * whose path was given in `view.package`, or an object directly
       * defined in `view.package`.
       */
      package?: Record<string, unknown>;

      /**
       * Merge given configuration object, excluding reserved keys.
       */
      loadObject(config: EnvironmentConfiguration): void;
      /**
       * Get the configuration object from given file.
       *
       * If the file is not found, emit a warning and fallback to default.
       *
       * The `dir` property will be the directory of the given file or the CWD
       * if no file is given. The configuration paths should be relative to
       * it.
       *
       * The given logger will be injected in the configuration object for
       * further usage.
       */
      loadFile(config: string): void;
      /**
       * @see loadObject
       * @see loadFile
       */
      load(config: string | EnvironmentConfiguration): void;
      /**
       * Try to load default `.sassdocrc` configuration file, or fallback
       * to an empty object.
       */
      loadDefaultFile(): void;
      /**
       * Post process the configuration to ensure `package` and `theme`
       * have uniform values.
       *
       * The `package` key is ensured to be an object. If it's a string, it's
       * required as JSON, relative to the configuration file directory.
       *
       * The `theme` key, if present and not already a function, will be
       * resolved to the actual theme function.
       */
      postProcess(): void;
      /**
       * Process `this.package`.
       */
      loadPackage(): void;
      /**
       * Load `package.json`.
       */
      defaultPackage(): void;
      /**
       * Process `this.theme`.
       */
      loadTheme(): void;
      /**
       * Try to load given theme module, or fallback to default theme.
       *
       */
      tryTheme (module: string): void;
      /**
       * Load `sassdoc-theme-default`.
       */
      defaultTheme(): void;
      /**
       * Try to load `this.file`
       *
       * @return A boolean indicating if the load was successfull
       */
      tryLoadCurrentFile(): boolean;
      /**
       * Try `this.parseFile` and return `false` if an `ENOENT` error
       * is thrown.
       *
       * Other exceptions are passed to the `error` event.
       */
      tryParseFile<T = unknown>(file: string): T | false;
      /**
       * Load YAML or JSON from given file.
       */
      parseFile<T = unknown>(file: string): T;
      /**
       * Resolve given file from `this.dir`.
       *
       * @param file
       * @param cwd - whether it's relative to CWD (like when defined in CLI).
       */
      resolve (file: string, cwd?: boolean): string;
    }

    export function ensureEnvironment(config?: EnvironmentConfiguration | null): Environment;

    export interface SassDocOptions extends EnvironmentConfiguration {
      /**
       * @default "./sassdoc"
       */
      dest?: string;
      /**
       * @default "[]"
       */
      exclude?: string[];
      /**
       * @default "./package.json"
       */
      package?: string | Object;
      /**
       * @default "default"
       */
      theme?: string;
      /**
       * @default "['requires', 'throws', 'content']"
       */
      autofill?: string[];
      /**
       * @default "{ undefined: 'general' }"
       */
      groups?: Record<string, string>;
      /**
       * @default "false"
       */
      noUpdateNotifier?: boolean;
    }

    type Example = {
      type?: string;
      description?: string;
      code: string;
    };

    type File = {
      path: string;
      name: string;
    };

    type Link = {
      url: string;
      caption?: string;
    };

    type Parameter = {
      type: string;
      name: string;
      description?: string;
    };

    type Property = {
      type: string;
      path: string;
      default?: string;
      description?: string;
    };

    type Require = {
      name: string;
      type: string;
      autofill?: boolean;
      description?: string;
      url?: string;
      item?: ParseResult;
    };

    type Return = {
      type: string;
      description?: string;
    };

    type Since = {
      version?: string;
      description?: string;
    };

    /**
     * @see http://sassdoc.com/annotations/
     * @see http://sassdoc.com/data-interface/
     */
    export interface ParseResult extends ScssCommentParser.ParseResult {
      access?: 'public' | 'private';
      alias?: string | string[];
      aliased?: Array<ParseResult>;
      author?: string[];
      content?: string;
      deprecated?: string;
      example?: Array<Example>;
      file: File;
      group?: string[];
      ignore?: string[];
      link?: Array<Link>;
      output?: string;
      parameter?: Array<Parameter>;
      property?: Array<Property>;
      require: Array<Require>;
      return?: Return;
      see?: string[];
      since?: Array<Since>;
      throw?: string[];
      todo?: string[];
      type?: string[];
      usedBy?: Array<ParseResult | 'Circular'>;
    }

    export interface Annotation extends ScssCommentParser.Annotation {}

    export function annotationFactory(env?: Environment): Annotation;

    export type BuiltInAnnotationNames = 'access' | 'alias' | 'author' | 'content' | 'deprecated' | 'example' | 'group' | 'groupDescription' | 'ignore' | 'link' | 'name' | 'output' | 'parameter' | 'property' | 'require' | 'return' | 'see' | 'since' | 'throw' | 'todo' | 'type';

    type BuiltInAnnotations = { [annotation in BuiltInAnnotationNames]: Annotation };

    type AnnotationAlias = {
      _: { alias: Record<string, string> }
    };

    class AnnotationsApi<UserAnnotations extends string> {
      constructor(env: Partial<Environment>);

      env: Environment;

      list: { [x in UserAnnotations]: Annotation } & BuiltInAnnotations & AnnotationAlias;

      /**
       * Add a single annotation by name
       */
      addAnnotation(name: string, annotation: typeof annotationFactory): void;

      /**
       * Add an array of annotations. The name of the annotations must be
       * in the `name` key of the annotation.
       */
      addAnnotations(annotations?: Array<typeof annotationFactory>): void;
    }

    export class Parser<UserAnnotations extends string> {
      constructor(config: Partial<Environment>, additionalAnnotations?: Array<typeof annotationFactory>);

      annotations: AnnotationsApi<UserAnnotations>;

      /**
       * @see scss-comment-parser
       */
      scssParser: ScssCommentParser.default;

      includeUnknownContexts?: boolean;

      parse(code: string, id?: string): Array<ScssCommentParser.ParseResult>;

      /**
       * Invoke the `resolve` function of an annotation if present.
       * Called with all found annotations except with type "unknown".
       */
      postProcess(data: Array<ParseResult>): Promise<Array<ParseResult>>;

      /**
       * Return a transform stream meant to be piped in a stream of SCSS
       * files. Each file will be passed-through as-is, but they are all
       * parsed to generate a SassDoc data array.
       *
       * The returned stream has an additional `promise` property, containing
       * a `Promise` object that will be resolved when the stream is done and
       * the data is fulfiled.
       */
      stream(): Stream;
    }

    /*
     * Boostrap Parser and AnnotationsApi, execute parsing phase.
     */
    export function parseFilter(env?: Partial<Environment>): Stream;

    /**
     * Parse and return data object
     */
    export function parse(path?: string | string[], options?: SassDocOptions): Promise<Array<ParseResult>>;

    /**
     * Don't pass files through, but pass final data at the end
     */
    export function parse(options?: SassDocOptions): Stream;

    export function sorter(data: Array<ParseResult>): Array<ParseResult>;

    namespace errors {
      export class SassDocError extends Error {
        constructor(message: string);
        name: 'SassDocError';
      }

      export class Warning extends Error {
        constructor(message: string);
        name: 'Warning';
      }
    }
  }
}
