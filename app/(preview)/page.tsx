//@ts-nocheck
'use client'

import { AttachmentIcon, BotIcon, UserIcon } from "@/components/icons"
import { useChat } from "ai/react"
import { DragEvent, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MicIcon, Moon, Sun, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const getTextFromDataUrl = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1]
  return window.atob(base64)
}
function downloadYAMLFile(content: any) {
  // Use regex to extract the content within a YAML code block
  const match = content.match(/```yaml\s([\s\S]*?)\s```/);

  if (match && match[1]) {
    const yamlContent = match[1].trim(); // Extract and trim the YAML content
    const blob = new Blob([yamlContent], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "download.yaml";
    link.click();
    URL.revokeObjectURL(url); // Clean up URL after download
  } else {
    toast.error("No valid YAML content found.");
  }
}


function TextFilePreview({ file }: { file: File }) {
  const [content, setContent] = useState<string>("")

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      setContent(typeof text === "string" ? text.slice(0, 100) : "")
    }
    reader.readAsText(file)
  }, [file])

  return (
    <div>
      {content}
      {content.length >= 100 && "..."}
    </div>
  )
}

export default function ChatInterface() {
  const { messages, input, handleSubmit, handleInputChange, isLoading } = useChat({
    onError: () => toast.error("You've been rate limited, please try again later!"),
  })
  const { setTheme } = useTheme()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const getTextFromDataUrl = (dataUrl: string) => {
    try {
      const text = atob(dataUrl.split(',')[1])
      return text.length > 100 ? text.slice(0, 100) + '...' : text
    } catch {
      return 'Unable to decode text'
    }
  }
  const [files, setFiles] = useState<FileList | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items

    if (items) {
      const files = Array.from(items)
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null)

      if (files.length > 0) {
        const validFiles = files.filter(
          (file) => file.type.startsWith("image/") || file.type.startsWith("text/")
        )

        if (validFiles.length === files.length) {
          const dataTransfer = new DataTransfer()
          validFiles.forEach((file) => dataTransfer.items.add(file))
          setFiles(dataTransfer.files)
        } else {
          toast.error("Only image and text files are allowed")
        }
      }
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFiles = event.dataTransfer.files
    const droppedFilesArray = Array.from(droppedFiles)
    if (droppedFilesArray.length > 0) {
      const validFiles = droppedFilesArray.filter(
        (file) => file.type.startsWith("image/") || file.type.startsWith("text/")
      )

      if (validFiles.length === droppedFilesArray.length) {
        const dataTransfer = new DataTransfer()
        validFiles.forEach((file) => dataTransfer.items.add(file))
        setFiles(dataTransfer.files)
      } else {
        toast.error("Only image and text files are allowed!")
      }

      setFiles(droppedFiles)
    }
    setIsDragging(false)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      const validFiles = Array.from(selectedFiles).filter(
        (file) => file.type.startsWith("image/") || file.type.startsWith("text/")
      )

      if (validFiles.length === selectedFiles.length) {
        const dataTransfer = new DataTransfer()
        validFiles.forEach((file) => dataTransfer.items.add(file))
        setFiles(dataTransfer.files)
      } else {
        toast.error("Only image and text files are allowed")
      }
    }
  }



  const [isRecognizing, setIsRecognizing] = useState(false);

  // Initialize Speech Recognition
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);


const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  
  const startSpeechRecognition = () => {
    if (!recognition) {
      toast.error("Speech Recognition not supported in this browser.");
      return;
    }

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecognizing(true);
    recognition.onend = () => setIsRecognizing(false);
    recognition.onerror = (event: any) => {
      toast.error(`Error occurred in speech recognition: ${event.error}`);
      setIsRecognizing(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleInputChange({ target: { value: input + " " + transcript } }); // Append transcript to input
    };

    recognition.start();
  };

  return (
    <div
      className="flex flex-col justify-between min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed inset-0 pointer-events-none bg-gray-100/90 dark:bg-gray-800/90 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="text-xl font-semibold">Drag and drop files here</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                (images and text)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              className={`flex items-start space-x-4 ${index === 0 ? "pt-4" : ""}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {message.role === "assistant" ? (
                  <BotIcon />
                ) : (
                  <UserIcon />
                )}
              </div>


              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
  <Markdown>{message.content}</Markdown>
  <div className="mt-2 flex flex-wrap gap-2">
      {message.experimental_attachments?.map((attachment) =>
        attachment.contentType?.startsWith("image") ? (
          <button
            key={attachment.name}
            onClick={() => setSelectedImage(attachment.url)}
            className="rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-40 h-40 object-cover transition-transform duration-300 ease-in-out hover:scale-105"
            />
          </button>
        ) : attachment.contentType?.startsWith("text") ? (
          <div
            key={attachment.name}
            className="text-xs w-40 h-24 overflow-hidden text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-2 rounded-md bg-gray-50 dark:bg-gray-800"
          >
            {getTextFromDataUrl(attachment.url)}
          </div>
        ) : null
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl w-full p-0">
          <div className="relative">
            <img
              src={selectedImage || ''}
              alt="Enlarged view"
              className="w-full h-auto"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  {/* Check if the content contains a code block */}
  {/\`\`\`/.test(message.content) && (
    <button
      onClick={() => downloadYAMLFile(message.content)}
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
    >
      Download Code Block as YAML
    </button>
  )}
</div>




            </motion.div>
          ))
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-2xl font-bold mb-4">Network Buddy</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This is an AI assistant that allows for the input of text files as well as images to return a YAML file related to networking.
            </p>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        onSubmit={(event) => {
          const options = files ? { experimental_attachments: files } : {}
          handleSubmit(event, options)
          setFiles(null)
        }}
      >
        <AnimatePresence>
          {files && files.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {Array.from(files).map((file) =>
                file.type.startsWith("image") ? (
                  <img
                    key={file.name}
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ) : file.type.startsWith("text") ? (
                  <div
                    key={file.name}
                    className="w-16 h-16 text-[8px] leading-tight overflow-hidden text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-1 rounded-md bg-gray-50 dark:bg-gray-800"
                  >
                    <TextFilePreview file={file} />
                  </div>
                ) : null
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          type="file"
          multiple
          accept="image/*,text/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={handleUploadClick}
            variant="outline"
            size="icon"
            className="flex-shrink-0"
          >
            <AttachmentIcon />
          </Button>
          <Button
        type="button"
        onClick={startSpeechRecognition}
        variant="outline"
        size="icon"
        className="flex-shrink-0"
        disabled={!SpeechRecognition || isRecognizing}
      >
        <MicIcon />
      </Button>
      <Input
        ref={inputRef}
        className="flex-1"
        placeholder="Send a message..."
        value={input}
        onChange={handleInputChange}
        onPaste={(e) => handlePaste(e)}
      />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}