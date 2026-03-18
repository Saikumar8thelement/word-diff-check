declare module "mark.js" {
  interface MarkOptions {
    element?: string;
    className?: string;
    separateWordSearch?: boolean;
    accuracy?: string;
    acrossElements?: boolean;
    ignoreJoiners?: boolean;
    done?: () => void;
  }

  export default class Mark {
    constructor(context: Element);
    mark(keyword: string | string[], options?: MarkOptions): void;
    markRegExp(regexp: RegExp, options?: MarkOptions): void;
    unmark(options?: Record<string, unknown>): void;
  }
}
