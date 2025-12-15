// Custom EditorJS tool for creating card blocks (Functional Component)

import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

interface CardData {
  heading: string;
  description: string;
  imageUrl: string;
}

interface CardToolConfig {
  uploader?: {
    uploadByFile?: (
      file: File
    ) => Promise<{ success: number; file: { url: string } }>;
  };
}

// React Component for the Card
const CardComponent = ({
  data,
  onChange,
  config,
}: {
  data: CardData;
  onChange: (data: CardData) => void;
  config: CardToolConfig;
}) => {
  const [heading, setHeading] = useState(data.heading || "");
  const [description, setDescription] = useState(data.description || "");
  const [imageUrl, setImageUrl] = useState(data.imageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onChange({ heading, description, imageUrl });
  }, [heading, description, imageUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (config.uploader?.uploadByFile) {
        const result = await config.uploader.uploadByFile(file);
        if (result.success) {
          setImageUrl(result.file.url);
        }
      } else {
        setImageUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleUrlSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setImageUrl(e.currentTarget.value);
    }
  };

  return (
    <div className="card-tool-wrapper">
      <style jsx>{`
        .card-tool-wrapper {
          margin: 20px 0;
        }

        .card-tool-container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .card-tool-heading {
          width: 100%;
          border: none;
          outline: none;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
          padding: 8px 0;
          text-transform: uppercase;
          color: #1a1a1a;
          font-family: inherit;
        }

        .card-tool-heading::placeholder {
          color: #9ca3af;
        }

        .card-tool-description {
          width: 100%;
          border: none;
          outline: none;
          font-size: 18px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 24px;
          padding: 8px 0;
          resize: vertical;
          font-family: inherit;
        }

        .card-tool-description::placeholder {
          color: #9ca3af;
        }

        .card-tool-image-section {
          position: relative;
          margin-top: 24px;
        }

        .card-tool-image {
          width: 100%;
          border-radius: 12px;
          object-fit: cover;
          max-height: 400px;
        }

        .card-tool-remove-image {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: background 0.2s;
        }

        .card-tool-remove-image:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .card-tool-upload-btn {
          width: 100%;
          padding: 48px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 12px;
        }

        .card-tool-upload-btn:hover {
          border-color: #9ca3af;
          background: #f3f4f6;
        }

        .card-tool-url-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .card-tool-url-input:focus {
          border-color: #3b82f6;
        }

        .hidden-file-input {
          display: none;
        }
      `}</style>

      <div className="card-tool-container">
        <input
          type="text"
          className="card-tool-heading"
          placeholder="Enter heading (e.g., OVERVIEW)"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
        />

        <textarea
          className="card-tool-description"
          placeholder="Enter description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="card-tool-image-section">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="Card" className="card-tool-image" />
              <button
                className="card-tool-remove-image"
                onClick={() => setImageUrl("")}
              >
                ×
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden-file-input"
                onChange={handleFileUpload}
              />
              <button
                className="card-tool-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Add Image
              </button>
              <input
                type="text"
                className="card-tool-url-input"
                placeholder="Or paste image URL..."
                onKeyPress={handleUrlSubmit}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// EditorJS Tool Wrapper
export default class CardTool {
  private api: any;
  private data: CardData;
  private wrapper: HTMLElement | null = null;
  private config: CardToolConfig;
  private root: any = null;

  static get toolbox() {
    return {
      title: "Card",
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({
    data,
    config,
    api,
    readOnly,
  }: {
    data?: CardData;
    config?: CardToolConfig;
    api: any;
    readOnly?: boolean;
  }) {
    this.api = api;
    this.config = config || {};
    this.data = {
      heading: data?.heading || "",
      description: data?.description || "",
      imageUrl: data?.imageUrl || "",
    };
  }

  render() {
    this.wrapper = document.createElement("div");

    this.root = createRoot(this.wrapper);
    this.root.render(
      <CardComponent
        data={this.data}
        onChange={(newData) => {
          this.data = newData;
        }}
        config={this.config}
      />
    );

    return this.wrapper;
  }

  save() {
    return this.data;
  }

  validate(savedData: CardData) {
    if (!savedData.heading.trim()) {
      return false;
    }
    return true;
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
    }
  }
}
