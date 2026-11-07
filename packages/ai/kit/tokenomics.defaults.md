---
schema: 1
default_needs: { reasoning: medium, context: medium }
strict_headers: false

providers:
  cursor:
    decide:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    design:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    build:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    check:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    context_windows: { small: 128k, medium: 256k, large: 1M } # UNVERIFIED placeholder, not measured

  claude:
    decide:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    design:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    build:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    check:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    context_windows: { small: 128k, medium: 256k, large: 1M } # UNVERIFIED placeholder, not measured

  codex:
    decide:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    design:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    build:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    check:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    context_windows: { small: 128k, medium: 256k, large: 1M } # UNVERIFIED placeholder, not measured

  muse:
    decide:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    design:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: high }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    build:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    check:
      trivial: { model: inherit, effort: medium }
      standard: { model: inherit, effort: medium }
      sensitive: { model: inherit, effort: high }
      critical: { model: inherit, effort: high }
    context_windows: { small: 128k, medium: 256k, large: 1M } # UNVERIFIED placeholder, not measured

gates:
  trivial: { review: optional }
  standard: { review: recommended }
  sensitive: { review: required }
  critical:
    review: required
    second_review: independent
    distinct_model: true
    human: required

agents: {}

hardcode:
  allow_paths: []
  extra_patterns: []
  scan_nested: false
---
