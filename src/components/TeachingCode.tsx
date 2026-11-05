// Lexical emphasis for teaching examples. The original source remains selectable.
export function TeachingCode({ source }: { source: string }) {
  const parts = source.split(
    /("[^"\n]*"|'[^'\n]*'|\b(?:if|else|for|while|int|double|String|bool|final|return|true|false|List|print|def|in|range|input|float|const|let|function)\b|\b\d+(?:\.\d+)?\b|&&|\|\||>=|<=|==|!=|[+*/=<>!])/g,
  );
  return (
    <pre className="guided-code">
      <code>
        {parts.map((part, i) => {
          const tone = /^["']/.test(part)
            ? "string"
            : /^\d/.test(part)
              ? "number"
              : /^(?:&&|\|\||>=|<=|==|!=|[+*/=<>!])$/.test(part)
                ? "operator"
                : /^\w+$/.test(part)
                  ? "keyword"
                  : "";
          return tone ? (
            <span className={`code-${tone}`} key={i}>
              {part}
            </span>
          ) : (
            part
          );
        })}
      </code>
    </pre>
  );
}
