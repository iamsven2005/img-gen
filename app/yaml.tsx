import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";

export default function MessageContent({ message }: any) {
  const [yamlContent, setYamlContent] = useState(null);

  const extractYamlContent = (markdownContent: any) => {
    // Parse the markdown content to find <code class="yaml"> blocks
    const parser = new DOMParser();
    const doc = parser.parseFromString(markdownContent, "text/html");
    const codeBlocks = doc.querySelectorAll("code.language-yaml");

    if (codeBlocks.length > 0) {
      // Get the content of the first YAML code block (or iterate if needed)
      const yamlText = codeBlocks[0].textContent;
      setYamlContent(yamlText);
    } else {
      setYamlContent(null);
    }
  };

  // Call extractYamlContent when the component renders or the message content changes
  useEffect(() => {
    extractYamlContent(message.content);
  }, [message.content]);

  const downloadYamlFile = () => {
    if (yamlContent) {
      const blob = new Blob([yamlContent], { type: "text/yaml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "download.yaml";
      link.click();
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <Markdown>{message.content}</Markdown>
      <div className="mt-2 flex flex-wrap gap-2">
        {message.experimental_attachments?.map((attachment: any) =>
          attachment.contentType?.startsWith("image") ? (
            <img
              key={attachment.name}
              src={attachment.url}
              alt={attachment.name}
              className="rounded-md w-40 h-40 object-cover"
            />
          ) : attachment.contentType?.startsWith("text") ? (
            <div
              key={attachment.name}
              className="text-xs w-40 h-24 overflow-hidden text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-2 rounded-md bg-gray-50 dark:bg-gray-800"
            >
              {getTextFromDataUrl(attachment.url)}
            </div>
          ) : null
        )}
      </div>
      {/* Show download button if YAML content is found */}
      {yamlContent && (
        <button
          onClick={downloadYamlFile}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Download YAML
        </button>
      )}
    </div>
  );
}
