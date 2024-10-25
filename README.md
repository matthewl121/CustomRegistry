[![ESLint](https://github.com/matthewl121/CustomRegistry/actions/workflows/eslint.yml/badge.svg?branch=main)](https://github.com/matthewl121/CustomRegistry/actions/workflows/eslint.yml)
# ACME Corp CLI Interface for Module Reuse

## Project Overview

The **ACME Corp CLI Interface** is a command-line tool designed to help ACME Corporation's service engineering teams efficiently select reusable open-source npm modules. This tool assesses each module based on multiple critical factors, including:

- **Ramp-up time**: How easy it is to learn and integrate the module.
- **Correctness**: The module's adherence to standards and functionality.
- **Bus Factor**: The number of maintainers, indicating how well the module is supported.
- **Responsiveness**: The maintainers' activity in addressing bugs and issues.
- **License Compatibility**: The module's license compatibility with the GNU Lesser General Public License v2.1 (LGPLv2.1), which is critical for ACME's self-hosted services.

This CLI is built to ensure that ACME's engineering teams can quickly evaluate and integrate third-party modules while maintaining high standards for quality and maintainability.

## Features

- **Parallelized Metric Calculations**: Calculates metrics (like ramp-up time, correctness) in parallel, optimizing for available system cores.
- **License Compatibility**: Ensures compatibility with LGPLv2.1 by parsing license information from either the README file or the LICENSE file in the repository.
- **Performance Monitoring**: The tool records the time taken to compute each metric, outputting latency for each score.
- **Extensible Design**: Built with the ability to add new metrics or adjust scoring mechanisms based on evolving needs.

## Installation

To install the CLI and its dependencies, run the following command in the root directory:

```bash
./run install
```

## Usage

The CLI supports several commands to help analyze and score npm and GitHub repositories.

### 1. Analyze Module URLs

To analyze a list of npm or GitHub module URLs, create a file (e.g., urls.txt) with one URL per line. Then, run:

```bash
./run /absolute/path/to/URL_FILE
```

This will process each URL and output the scores for the following metrics:

- **NetScore**: A weighted sum of all the individual scores.
- **RampUp**: How quickly engineers can start using the module.
- **Correctness**: The module's reliability.
- **BusFactor**: The risk level associated with module maintainers.
- **ResponsiveMaintainer**: The maintainers' speed in addressing issues.
- **License**: Whether the module is compatible with ACME's licensing requirements.

The output will be in NDJSON format, with each row containing the following fields:

- `URL`
- `NetScore`, `NetScore_Latency`
- `RampUp`, `RampUp_Latency`
- `Correctness`, `Correctness_Latency`
- `BusFactor`, `BusFactor_Latency`
- `ResponsiveMaintainer`, `ResponsiveMaintainer_Latency`
- `License`, `License_Latency`

### Metrics and Weights

| Metric                    | Weight |
|---------------------------|--------|
| **Ramp-Up Time**          | 0.30   |
| **Correctness**           | 0.30   |
| **Bus Factor**            | 0.20   |
| **Responsive Maintainer** | 0.10   |
| **License Compatibility**  | 0.10   |

#### Calculation Formula

The Net Score is calculated using the formula:

Net Score = (Ramp-Up Time * 0.30) + (Correctness * 0.30) + (Bus Factor * 0.20) + (Responsive Maintainer * 0.10) + (License Compatibility * 0.10)

#### Score Range

Each metric is scored in the range of **[0, 1]**, where:
- **0** indicates total failure.
- **1** indicates perfection.

#### Metric Weight Justification
- **RampUp * 0.30**: The goal is to minimize the time it takes for engineers to effectively use new modules. A high ramp-up time means faster project kickoffs and reduced onboarding costs. This is crucial for maintaining productivity, especially as the user scales its use of Node.js services.
- **Correctness * 0.30**:  Reliability is vital for production environments--so this weight ensures that modules are stable and trustworthy, reducing the risk of bugs and downtime that could impact the user's reputation.
- **BusFactor * 0.25**: The bus factor assesses the risk associated with a module's maintainers. A slightly lower weight reflects the understanding that while important, teams can often find alternatives if necessary, though it’s still critical for long-term viability.
- **ResponsiveMaintainer * 0.15**:  Timely responses from maintainers can significantly impact ongoing development. This metric is weighted lower, as stable and well-documented modules can sometimes offset slower response times.
- **License * 0.10**: Ensuring that a module has a compatible license is essential for legal compliance. However, this metric is typically a straightforward binary assessment, which is why it carries the least weight.


### 2. Run Tests

To run the test suite, execute:

```bash
./run test
```

The output will be in the format:

```bash
X/Y test cases passed. Z% line coverage achieved.
```

### 3. Logging

The CLI generates log files using the verbosity level set by the `$LOG_LEVEL` environment variable. Log levels are as follows:

- **0**: Silent (default)
- **1**: Informational messages
- **2**: Debug messages

Logs are stored in the file defined by the `$LOG_FILE` environment variable.

### Error Handling

In the event of an error, the CLI will exit with code 1 and provide a detailed error message. Make sure to review the error message design resource for more information.

### Performance Considerations

For better performance, the tool leverages parallelism in metric calculations, based on the number of available cores. You can benchmark the tool's performance by running it on a variety of module URLs and comparing latency values.

### License

This project is licensed under the GNU Lesser General Public License v2.1. All open-source modules used by this tool must also be compatible with LGPLv2.1 to comply with ACME Corporation's licensing requirements.
