"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Extension } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Palette,
  Maximize2
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  onFullscreenToggle?: () => void;
  showFullscreenButton?: boolean;
}

const COLOR_PRESETS = [
  { name: 'Blueberry', color: '#5B8FF9' },
  { name: 'Peacock', color: '#5AD8F7' },
  { name: 'Sage', color: '#5FD0AB' },
  { name: 'Basil', color: '#0E9384' },
  { name: 'Lime', color: '#84CC16' },
  { name: 'Banana', color: '#FACC15' },
  { name: 'Tangerine', color: '#FB923C' },
  { name: 'Tomato', color: '#EF4444' },
  { name: 'Lavender', color: '#C084FC' },
  { name: 'Grape', color: '#8B5CF6' },
  { name: 'Dark', color: '#1F2937' },
  { name: 'Graphite', color: '#4B5563' },
  { name: 'Lava', color: '#6B7280' },
  { name: 'Smoke', color: '#9CA3AF' },
  { name: 'Silver', color: '#D1D5DB' },
  { name: 'Cloud', color: '#E5E7EB' },
  { name: 'Coconut', color: '#F3F4F6' },
  { name: 'Black', color: '#000000' },
];

export function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Start typing...',
  className = '',
  onFullscreenToggle,
  showFullscreenButton = false
}: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      FontSize,
      Color.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 font-bold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor || !isMounted) {
    return (
      <div className={`border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          <div className="animate-pulse">Loading editor...</div>
        </div>
      </div>
    );
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <select
            className="h-8 px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' :
              editor.isActive('heading', { level: 4 }) ? '4' :
              editor.isActive('heading', { level: 5 }) ? '5' :
              editor.isActive('heading', { level: 6 }) ? '6' : 'normal'
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'normal') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
              }
            }}
          >
            <option value="normal">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <select
            className="h-8 px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'default') {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(value).run();
              }
            }}
          >
            <option value="default">Font Size</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
            <option value="36px">36px</option>
            <option value="48px">48px</option>
          </select>
        </div>

        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="h-8 w-8 p-0"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        {/* Color Picker */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2 relative">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-8 w-8 p-0"
              title="Text Color"
            >
              <div className="flex flex-col items-center justify-center">
                <Palette className="h-4 w-4" />
                <div 
                  className="h-1 w-6 rounded"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
            </Button>
            
            {showColorPicker && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowColorPicker(false)}
                />
                <div className="absolute top-10 left-0 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-80 overflow-y-auto">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-left transition-colors"
                      onClick={() => {
                        setSelectedColor(preset.color);
                        editor.chain().focus().setColor(preset.color).run();
                        setShowColorPicker(false);
                      }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-sm">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Block Elements */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="h-8 px-2 text-xs"
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4 mr-1" />
            Table
          </Button>
          {editor.isActive('table') && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="h-8 px-2 text-xs"
                title="Add Row Before"
              >
                Row+
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="h-8 px-2 text-xs"
                title="Add Column Before"
              >
                Col+
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="h-8 px-2 text-xs"
                title="Delete Table"
              >
                Del
              </Button>
            </>
          )}
        </div>

        {/* Links */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('link') ? 'default' : 'ghost'}
            size="sm"
            onClick={addLink}
            className="h-8 w-8 p-0"
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            className="h-8 w-8 p-0"
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Fullscreen Toggle */}
        {showFullscreenButton && onFullscreenToggle && (
          <div className="flex gap-1 border-l border-gray-200 pl-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onFullscreenToggle}
              className="h-8 w-8 p-0"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="rich-text-editor-content">
        <EditorContent editor={editor} />
      </div>
      
      <style>{`
        .rich-text-editor-content .ProseMirror {
          min-height: 200px;
          padding: 1rem;
        }
        
        .rich-text-editor-content .ProseMirror h1 {
          font-size: 2em !important;
          font-weight: bold !important;
          margin-top: 0.67em !important;
          margin-bottom: 0.67em !important;
          line-height: 1.2 !important;
        }
        
        .rich-text-editor-content .ProseMirror h2 {
          font-size: 1.5em !important;
          font-weight: bold !important;
          margin-top: 0.83em !important;
          margin-bottom: 0.83em !important;
          line-height: 1.3 !important;
        }
        
        .rich-text-editor-content .ProseMirror h3 {
          font-size: 1.17em !important;
          font-weight: bold !important;
          margin-top: 1em !important;
          margin-bottom: 1em !important;
          line-height: 1.4 !important;
        }
        
        .rich-text-editor-content .ProseMirror h4 {
          font-size: 1em !important;
          font-weight: bold !important;
          margin-top: 1.33em !important;
          margin-bottom: 1.33em !important;
        }
        
        .rich-text-editor-content .ProseMirror h5 {
          font-size: 0.83em !important;
          font-weight: bold !important;
          margin-top: 1.67em !important;
          margin-bottom: 1.67em !important;
        }
        
        .rich-text-editor-content .ProseMirror h6 {
          font-size: 0.67em !important;
          font-weight: bold !important;
          margin-top: 2.33em !important;
          margin-bottom: 2.33em !important;
        }
        
        .rich-text-editor-content .ProseMirror p {
          margin: 0.5em 0;
        }
        
        .rich-text-editor-content .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
          margin: 1em 0 !important;
        }
        
        .rich-text-editor-content .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 2rem !important;
          margin: 1em 0 !important;
        }
        
        .rich-text-editor-content .ProseMirror li {
          margin: 0.5em 0;
          display: list-item !important;
        }
        
        .rich-text-editor-content .ProseMirror ul ul {
          list-style-type: circle !important;
        }
        
        .rich-text-editor-content .ProseMirror ul ul ul {
          list-style-type: square !important;
        }
        
        .rich-text-editor-content .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-text-editor-content .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .rich-text-editor-content .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .rich-text-editor-content .ProseMirror table td,
        .rich-text-editor-content .ProseMirror table th {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          min-width: 50px;
        }
        
        .rich-text-editor-content .ProseMirror table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
