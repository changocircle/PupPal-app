/**
 * MarkdownText, lightweight inline markdown for chat bubbles.
 *
 * Supports:
 *   **bold**   -> bold weight
 *   *italic*   -> italic style
 *   \n         -> line breaks (handled by RN Text natively)
 *
 * No external dependencies. Keeps bundle small for a chat UI.
 */

import React from "react";
import { Text, type TextStyle } from "react-native";

interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
}

interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function parseMarkdown(input: string): Segment[] {
  const segments: Segment[] = [];
  // Regex: match **bold**, then *italic*, then plain text between them
  // Process **bold** first (greedy but non-greedy content), then *italic*
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    // Push any plain text before this match
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // **bold**
      segments.push({ text: match[2]!, bold: true });
    } else if (match[3]) {
      // *italic*
      segments.push({ text: match[4]!, italic: true });
    }

    lastIndex = match.index + match[0].length;
  }

  // Push any remaining plain text
  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex) });
  }

  return segments;
}

export function MarkdownText({ children, style }: MarkdownTextProps) {
  if (!children) return null;

  const segments = parseMarkdown(children);

  // If no formatting found, render plain text (fast path)
  if (segments.length === 1 && !segments[0]!.bold && !segments[0]!.italic) {
    return <Text style={style}>{children}</Text>;
  }

  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        if (seg.bold) {
          return (
            <Text key={i} style={{ fontWeight: "700" }}>
              {seg.text}
            </Text>
          );
        }
        if (seg.italic) {
          return (
            <Text key={i} style={{ fontStyle: "italic" }}>
              {seg.text}
            </Text>
          );
        }
        return <Text key={i}>{seg.text}</Text>;
      })}
    </Text>
  );
}
