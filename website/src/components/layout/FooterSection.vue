<template>
  <div class="footer-section">
    <div class="footer-wrapper">
      <div class="footer-subsection">
        <div class="footer-subsection-inner">
          <h3>PRIDEbot</h3>
          <p>
            PRIDEbot is developed with no monetization by Linn.
          </p>
        </div>
      </div>
      <div class="footer-subsection">
        <div class="footer-subsection-inner">
          <h3>Message of the day:</h3>
          <p>
            Do you really think I have the energy to make a message change every day? &lt;3
          </p>
        </div>
      </div>
      <div class="footer-subsection">
        <div class="footer-subsection-inner">
          <h3>External links</h3>
          <ul>
            <li><a href="https://linn.lgbt">Linn's Blog</a></li>
            <li><a href="https://github.com/pride-universe/PRIDEbot">Source on GitHub</a></li>
            <li><a href="https://thiscatdoesnotexist.com/">Nonexistent cat</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'FooterSection',
};
</script>

<style scoped>
.footer-section {
  background-color: var(--background-tertiary);
  overflow: hidden;
  text-align: left;
  line-height: 1.3em;
}
.footer-wrapper {
  padding: 1rem 0 0rem;
  margin: auto;
  max-width: 1400px;
  flex-wrap: wrap;
}
.footer-subsection {
  flex-basis: 33%;
  max-width: 350px;
  margin: 1rem auto;
}
.footer-subsection-inner {
  padding: 0 .5rem;
}
ul {
  list-style: none;
  padding-inline-start: 0;
  margin-bottom: 0;
}
h3 {
  font-size: 1.3em;
  font-weight: bold;
}
.footer-subsection-inner > h3:first-of-type {
  margin-top: 0;
}

@media (min-width: 650px) {
  .footer-wrapper {
    display: flex;
  }
  .footer-subsection {
    max-width: unset;
  }
  .footer-subsection:first-of-type > .footer-subsection-inner {
    padding-left: 2rem;
  }
  .footer-subsection:last-of-type > .footer-subsection-inner {
    padding-right: 2rem;
  }
}
</style>
