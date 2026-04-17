import React, { useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./GlassButton.module.css";

const GlassButton = ({ onClick, to, label = "START A PROJECT" }) => {
  const buttonRef = useRef(null);
  const blobRef = useRef(null);

  const handleMouseEnter = () => {
    if (blobRef.current) {
      blobRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (blobRef.current) {
      blobRef.current.style.opacity = "0";
    }
  };

  const handleMouseMove = (e) => {
    const button = buttonRef.current;
    const blob = blobRef.current;
    if (!button || !blob) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    blob.style.transform = `translate(${x - 100}px, ${y - 100}px)`;
  };

  const interactiveProps = {
    ref: buttonRef,
    className: styles.glassBtn,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove,
    children: (
      <>
        <span>{label}</span>
        <div ref={blobRef} className={styles.blob} />
      </>
    ),
  };

  if (to) {
    return (
      <Link {...interactiveProps} to={to} onClick={onClick} />
    );
  }

  return (
    <button {...interactiveProps} type="button" onClick={onClick} />
  );
};

export default GlassButton;
