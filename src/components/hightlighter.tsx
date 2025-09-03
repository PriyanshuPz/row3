"use client";

import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";
import type React from "react";
import { useInView } from "framer-motion";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

interface HighlighterProps {
  children: React.ReactNode;
  action?: AnnotationAction;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  isView?: boolean;
  fadeOutTimeout?: number | null; // Time in ms after which the highlight fades out, null for no fade out
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  fadeOutTimeout = 3000,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const annotationRef = useRef<any>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  const isInView = useInView(elementRef, {
    once: true,
    margin: "-10%",
  });

  // If isView is false, always show. If isView is true, wait for inView
  const shouldShow = !isView || isInView;

  useEffect(() => {
    if (!shouldShow) return;

    const element = elementRef.current;
    if (!element) return;

    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    });

    // Store the annotation reference for later use
    annotationRef.current = annotation;

    annotation.show();

    // Set up fade out if timeout is provided
    if (fadeOutTimeout !== null && fadeOutTimeout > 0) {
      fadeTimeoutRef.current = window.setTimeout(() => {
        annotation.remove();
      }, fadeOutTimeout);
    }

    return () => {
      // Clear any pending timeouts
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
      }

      // Remove annotation when component unmounts
      if (element && annotationRef.current) {
        annotationRef.current.remove();
      }
    };
  }, [
    shouldShow,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
    fadeOutTimeout,
  ]);

  return (
    <span ref={elementRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  );
}
