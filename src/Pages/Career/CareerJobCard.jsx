import React from "react";
import { Link } from "react-router-dom";
import GlassButton from "../../Components/GlassButton/GlassButton";
import styles from "./Career.module.css";

/**
 * One open position: image, title, excerpt, and links to the single job page (/career/:legacyId).
 * `job` matches GET /api/public/career-posts items: { id, title, description, listImage, ... }.
 */
export default function CareerJobCard({ job, resolveAssetUrl }) {
  const detailPath = `/career/${job.id}`;

  return (
    <div className={styles.jobCard}>
      <Link to={detailPath} className={styles.jobImageWrapper}>
        <img
          src={resolveAssetUrl(job.listImage)}
          alt={job.title || "Job"}
          className={styles.jobImage}
        />
      </Link>
      <div className={styles.jobContent}>
        <Link to={detailPath} className={styles.jobTitleLink}>
          <h3 className={styles.jobTitle}>{job.title}</h3>
        </Link>
        <p className={styles.jobDescription}>{job.description}</p>
        <GlassButton label="APPLY NOW" to={detailPath} />
      </div>
    </div>
  );
}
