import React, { useEffect } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import styles from "./PrivacyPolicy.module.css";

const PrivacyPolicy = () => {
  useEffect(() => {
    // Always start from the top when the route is opened
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.content} aria-label="Privacy Policy content">
        <h1 className={styles.title}>Privacy Policy</h1>

        <div className={styles.body}>
          <p>
            Prites Photography is the data controller for the processing of personal
            data described in this privacy policy.
          </p>
          <p>
            In this privacy policy, we explain what types of personal data we
            store and how we process them. It also describes your rights in
            relation to us and how you can exercise those rights. You can
            always contact us with questions regarding privacy and data
            protection by sending an email to privacy@example.com.
          </p>

          <h2 className={styles.sectionTitle}>
            Personal Data We Collect and Process
          </h2>
          <p>We process the following categories of personal data:</p>
          <p>
            Basic information: Name, date of birth
            <br />
            Contact information: Address, phone number, email address
            <br />
            Payment information: Transaction details, payment methods
            <br />
            Customer history and engagement: Order and delivery information,
            active products and agreements, previously held products and
            services, usage frequency, and status of products/services
          </p>

          <p>
            Personal data is usually collected directly from you when you fill
            out our contact form or is generated when you use our services and
            products.
          </p>

          <h2 className={styles.sectionTitle}>
            How We Use Your Personal Data
          </h2>
          <h3 className={styles.subSectionTitle}>
            Service/Agreement Fulfillment
          </h3>
          <p>
            We use your personal data to fulfill our agreements with you, meaning
            when you have ordered a product or service from us. The legal basis
            for processing personal data for this purpose is that the processing
            is necessary to fulfill an agreement with you.
          </p>
          <p>
            We also use your personal data to contact you when you have filled
            out our contact form as a potential customer.
          </p>

          <h3 className={styles.subSectionTitle}>
            Customer Relationship Management
          </h3>
          <p>
            We use your personal data to manage our customer relationship with
            you. This includes customer service, handling complaints, and
            troubleshooting related to your account. The legal basis for
            processing personal data for this purpose is that the processing is
            necessary to fulfill an agreement with you.
          </p>

          <h3 className={styles.subSectionTitle}>
            Compliance with Legal Obligations
          </h3>
          <p>
            In some cases, we are required to process personal data due to
            legal obligations. An example of this is sales-related information,
            which we are required to record and store according to accounting
            laws.
          </p>
          <p>
            The legal basis for processing personal data for this purpose is that
            the processing is necessary to fulfill a legal obligation.
          </p>

          <h2 className={styles.sectionTitle}>Your Rights</h2>
          <p>
            If you wish to exercise any of your rights, please contact us at
            Mail.
          </p>
          <h3 className={styles.subSectionTitle}>Right to Access Your Data</h3>
          <p>
            You can request a copy of all the data we process about you. Contact
            the email address above to exercise your right of access.
          </p>

          <h3 className={styles.subSectionTitle}>
            Right to Rectification of Personal Data
          </h3>
          <p>
            You have the right to request that we correct or complete any
            inaccurate or misleading information.
          </p>

          <h3 className={styles.subSectionTitle}>Right to Erasure of Personal Data</h3>
          <p>
            You have the right to have your personal data erased without undue
            delay. You may request deletion of your data at any time. However,
            note that information we are legally required to retain (such as for
            accounting purposes) will not be deleted.
          </p>

          <h3 className={styles.subSectionTitle}>
            Restriction of Personal Data Processing
          </h3>
          <p>
            In certain situations, you may also request that we restrict the
            processing of your data. You can do this by managing your consents
            or preferences within our systems.
          </p>

          <h3 className={styles.subSectionTitle}>
            Right to Object to Data Processing
          </h3>
          <p>
            If we process your data based on our legitimate interests, you have
            the right to object to this processing. You can do so by managing
            your consents or preferences within our systems.
          </p>

          <h3 className={styles.subSectionTitle}>Data Portability</h3>
          <p>
            You have the right to receive your personal data in a structured,
            commonly used, and machine-readable format. Contact the email
            address above to obtain your data.
          </p>

          <h3 className={styles.subSectionTitle}>
            Complaints About Our Data Processing
          </h3>
          <p>
            We hope you inform us if you believe we are not complying with data
            protection regulations. Please reach out to us first through the
            contact method you have already established with us.
          </p>
          <p>
            You also have the right to file a complaint regarding our data
            processing with the relevant data protection authority.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

