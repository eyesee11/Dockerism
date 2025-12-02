document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// main entry point fam
function initApp() {
  setupNavigation();
  setupSimulator();
  setupDockerfileInteractions();
  setupVisualBuilder();
  setupThemeToggle();
}

// --- Visual Builder (The Artsy Stuff) ---
function setupVisualBuilder() {
  const nextBtn = document.getElementById("next-build-btn");
  const stepNum = document.getElementById("build-step-num");
  const desc = document.getElementById("build-description");
  const contextBox = document.getElementById("context-box");
  const imageStack = document.getElementById("image-stack");

  let currentBuildStep = 0;

  // steps for the build animation
  const steps = [
    {
      desc: "Step 1: Yeeting context to Docker daemon...",
      action: () => {
        // move files to context box
        ["file-pkg", "file-src", "file-docker"].forEach((id, i) => {
          const el = document.getElementById(id);
          // slightly diff rotation for chaos
          el.style.transform = `translate(180%, ${50 - i * 50}px) rotate(${
            5 - i * 5
          }deg)`;
        });

        setTimeout(() => {
          contextBox.classList.add("processing");
          contextBox.innerHTML =
            '<span class="label" style="color:#000">Context Received (25KB)</span>';
        }, 600);
      },
    },
    {
      desc: "Step 2: FROM node:18-alpine",
      action: () => addLayer("Base Image: Node 18 Alpine", "#fff"),
    },
    {
      desc: "Step 3: WORKDIR /app & COPY package.json",
      action: () => addLayer("Layer: /app created", "#eee"),
    },
    {
      desc: "Step 4: RUN npm install",
      action: () => {
        contextBox.classList.add("processing");
        desc.textContent = "Installing dependencies... (npm install)";
        setTimeout(() => {
          contextBox.classList.remove("processing");
          addLayer("Layer: node_modules", "#ddd");
        }, 1000);
      },
    },
    {
      desc: "Step 5: COPY . . & CMD",
      action: () => {
        addLayer("Layer: App Source Code", "#ccc");
        setTimeout(() => {
          alert("Build Complete! Image tagged as 'my-web-app:latest'");
          nextBtn.textContent = "Reset Build";
        }, 500);
      },
    },
  ];

  // helper to stack layers
  function addLayer(text, bg) {
    const div = document.createElement("div");
    div.className = "image-layer";
    div.textContent = text;
    div.style.background = bg;
    imageStack.appendChild(div);
  }

  // click handler for the build button
  nextBtn.addEventListener("click", () => {
    if (currentBuildStep >= steps.length) {
      // reset everything if we done
      currentBuildStep = 0;
      stepNum.textContent = "0";
      desc.textContent = "Ready to start building...";
      nextBtn.textContent = "Start Build";
      imageStack.innerHTML = "";
      contextBox.innerHTML = '<span class="label">Build Context</span>';
      contextBox.classList.remove("processing");

      ["file-pkg", "file-src", "file-docker"].forEach((id) => {
        document.getElementById(id).style.transform = "none";
      });
      return;
    }

    // execute the step
    const step = steps[currentBuildStep];
    desc.textContent = step.desc;
    step.action();

    currentBuildStep++;
    stepNum.textContent = currentBuildStep;

    nextBtn.textContent =
      currentBuildStep < steps.length ? "Next Step" : "Finish";
  });
}

// --- Navigation (The Map) ---
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-links li");
  const sections = document.querySelectorAll(".section");

  // subsections inside the #guide
  const guideSubSections = [
    "intro",
    "concepts",
    "vm-vs-container",
    "dockerfile",
  ];

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      console.log(
        "Clicked:",
        item.textContent.trim(),
        "Target:",
        item.getAttribute("data-section")
      );
      // vibe check the active class
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      const targetId = item.getAttribute("data-section");

      // if it's a guide subsection, we gotta show the guide first
      if (guideSubSections.includes(targetId)) {
        console.log("Navigating to guide subsection:", targetId);
        sections.forEach((section) => {
          section.classList.remove("active");
          if (section.id === "guide") section.classList.add("active");
        });

        // smooth scroll to the block
        const targetBlock = document.getElementById(targetId);
        if (targetBlock) {
          targetBlock.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          console.error("Target block not found:", targetId);
        }
      } else {
        console.log("Navigating to standard section:", targetId);
        // standard section switch
        sections.forEach((section) => {
          section.classList.remove("active");
          if (section.id === targetId) {
            section.classList.add("active");
            console.log("Activated section:", section.id);
          }
        });

        // Scroll to top of content area
        document.querySelector(".content-area").scrollTop = 0;
      }
    });
  });

  // start the spy
  setupScrollSpy(guideSubSections);
}

// spy on scroll to update nav
function setupScrollSpy(guideSubSections) {
  const contentArea = document.querySelector(".content-area");
  const navItems = document.querySelectorAll(".nav-links li");

  contentArea.addEventListener("scroll", () => {
    const guideSection = document.getElementById("guide");
    // if guide ain't active, we sleep
    if (!guideSection.classList.contains("active")) return;

    let currentSectionId = "";

    // check who is visible
    for (const id of guideSubSections) {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        // magic numbers for visibility detection
        if (rect.top <= 200 && rect.bottom >= 200) {
          currentSectionId = id;
          break;
        }
      }
    }

    if (currentSectionId) {
      navItems.forEach((nav) => {
        nav.classList.remove("active");
        if (nav.getAttribute("data-section") === currentSectionId) {
          nav.classList.add("active");
        }
      });
    }
  });
}

// helper to nav programmatically
function navigateTo(sectionId) {
  const navItem = document.querySelector(
    `.nav-links li[data-section="${sectionId}"]`
  );
  if (navItem) navItem.click();
}

// --- Simulator (The Matrix) ---
function setupSimulator() {
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const guideContent = document.getElementById("guide-content");
  const feedback = document.getElementById("feedback-area");

  let currentScenario = "local"; // 'local', 'aws', or 'ecr'
  let currentStep = 1;
  let isConnectedToEc2 = false;

  // fake state to keep track of containers
  const state = {
    containers: [],
    images: ["hello-world:latest", "nginx:latest", "node:18-alpine"],
    running: [],
  };

  let history = [];
  let historyIndex = -1;

  // scenario configs
  const scenarios = {
    local: {
      title: "Local Docker Basics",
      steps: [
        {
          id: 1,
          title: "Step 1: Hello World",
          desc: "Pull and run a simple image to verify installation.",
          hint: "docker run hello-world",
        },
        {
          id: 2,
          title: "Step 2: List Containers",
          desc: "See what containers have run (including stopped ones).",
          hint: "docker ps -a",
        },
        {
          id: 3,
          title: "Step 3: Run a Web Server",
          desc: "Run an Nginx server in detached mode.",
          hint: "docker run -d -p 8080:80 nginx",
        },
        {
          id: 4,
          title: "Step 4: Check Running Containers",
          desc: "See the currently running Nginx container.",
          hint: "docker ps",
        },
      ],
    },
    aws: {
      title: "AWS Full Stack Mission",
      steps: [
        {
          id: 1,
          title: "Step 1: Configure AWS",
          desc: "Set up your AWS credentials to manage the account.",
          hint: "aws configure",
        },
        {
          id: 2,
          title: "Step 2: Launch Instance",
          desc: "Use CLI to launch a new EC2 instance.",
          hint: "aws ec2 run-instances --image-id ami-12345 --count 1 --instance-type t2.micro",
        },
        {
          id: 3,
          title: "Step 3: Connect to Server",
          desc: "SSH into your new production instance.",
          hint: "ssh -i key.pem user@54.123.45.67",
        },
        {
          id: 4,
          title: "Step 4: Verify Files",
          desc: "Check if the project files are present on the server.",
          hint: "ls",
        },
        {
          id: 5,
          title: "Step 5: Deploy Stack",
          desc: "Start the full stack application using Docker Compose.",
          hint: "sudo docker-compose up -d",
        },
        {
          id: 6,
          title: "Step 6: Verify Deployment",
          desc: "Check if all 3 containers (Frontend, Backend, DB) are running.",
          hint: "sudo docker ps",
        },
      ],
    },
    ecr: {
      title: "AWS ECR Distribution Mission",
      steps: [
        {
          id: 1,
          title: "Step 1: Build Image",
          desc: "Build your local application image.",
          hint: "docker build -t my-app .",
        },
        {
          id: 2,
          title: "Step 2: ECR Login",
          desc: "Authenticate Docker with your AWS ECR registry.",
          hint: "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 12345.dkr.ecr.us-east-1.amazonaws.com",
        },
        {
          id: 3,
          title: "Step 3: Tag Image",
          desc: "Tag your image with the full ECR repository URL.",
          hint: "docker tag my-app:latest 12345.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
        },
        {
          id: 4,
          title: "Step 4: Push to Cloud",
          desc: "Upload your image to AWS ECR.",
          hint: "docker push 12345.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
        },
        {
          id: 5,
          title: "Step 5: Switch Device",
          desc: "Simulate switching to a production server.",
          hint: "ssh production-server",
        },
        {
          id: 6,
          title: "Step 6: Pull & Run",
          desc: "Download and run your image from the cloud.",
          hint: "docker run -d -p 80:80 12345.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
        },
      ],
    },
    masterclass: {
      title: "ECR Masterclass Mission",
      steps: [
        {
          id: 1,
          title: "Step 1: Create Project",
          desc: "Create a folder named 'myapp'.",
          hint: "mkdir myapp",
        },
        {
          id: 2,
          title: "Step 2: Enter Folder",
          desc: "Navigate into your new project folder.",
          hint: "cd myapp",
        },
        {
          id: 3,
          title: "Step 3: Create Files",
          desc: "Create index.js and Dockerfile (Simulated).",
          hint: "touch index.js Dockerfile",
        },
        {
          id: 4,
          title: "Step 4: Build Image",
          desc: "Build your Node.js image.",
          hint: "docker build -t myapp:latest .",
        },
        {
          id: 5,
          title: "Step 5: Run Local",
          desc: "Run the container to test it.",
          hint: "docker run --name myapp_container myapp:latest",
        },
        {
          id: 6,
          title: "Step 6: Create Web Repo",
          desc: "Create an ECR repository for the website.",
          hint: "aws ecr create-repository --repository-name mywebsite --region us-east-1",
        },
        {
          id: 7,
          title: "Step 7: Login to ECR",
          desc: "Authenticate Docker with AWS.",
          hint: "aws ecr get-login-password | docker login",
        },
        {
          id: 8,
          title: "Step 8: Tag Image",
          desc: "Tag the website image for ECR.",
          hint: "docker tag mywebsite:latest 196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite:latest",
        },
        {
          id: 9,
          title: "Step 9: Push to Cloud",
          desc: "Upload image to AWS ECR.",
          hint: "docker push 196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite:latest",
        },
        {
          id: 10,
          title: "Step 10: Switch Device",
          desc: "Switch to Student Laptop.",
          hint: "switch-device student-laptop",
        },
        {
          id: 11,
          title: "Step 11: Pull from Cloud",
          desc: "Download the image on the student laptop.",
          hint: "docker pull 196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite:latest",
        },
        {
          id: 12,
          title: "Step 12: Run on Student Laptop",
          desc: "Run the website from the cloud image.",
          hint: "docker run -d -p 8082:80 196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite:latest",
        },
      ],
    },
  };

  // expose globals for the buttons
  window.startAwsMission = () => {
    navigateTo("simulator");
    loadScenario("aws");
  };
  window.startEcrMission = () => {
    navigateTo("simulator");
    loadScenario("ecr");
  };
  window.startMasterclassMission = () => {
    navigateTo("simulator");
    loadScenario("masterclass");
  };

  // load a scenario and reset state
  function loadScenario(scenarioName) {
    currentScenario = scenarioName;
    currentStep = 1;
    isConnectedToEc2 = false;
    output.innerHTML = "";
    feedback.innerHTML = "";

    state.containers = [];
    state.running = [];

    const scenario = scenarios[scenarioName];
    document.querySelector(".guide-panel h3").textContent = scenario.title;

    let introText = "Welcome to Docker Simulator.";
    if (scenarioName === "aws")
      introText = "Mission: Deploy Full Stack App to AWS.";
    if (scenarioName === "ecr")
      introText = "Mission: Distribute Image via AWS ECR.";
    if (scenarioName === "masterclass")
      introText = "Mission: Complete the Full ECR Masterclass Workflow.";

    let html = `<p>${introText}</p>`;

    if (scenarioName === "masterclass") {
      html += `
            <div class="network-visualizer" style="padding: 0.5rem; margin: 0.5rem 0; transform: scale(0.9); transform-origin: center top; border: 1px solid #ccc;">
                <div class="device" id="device-laptop-a" style="width: 80px; padding: 0.5rem;">
                    <div class="icon" style="font-size: 2rem;">💻</div>
                    <span style="font-size:0.7rem">Laptop A</span>
                </div>
                <div class="cloud-path">
                    <div class="packet" id="demo-packet" style="font-size: 1.5rem; top: -5px;">📦</div>
                    <div class="line"></div>
                    <div class="cloud-icon" style="font-size:2rem; margin: 0 0.5rem;">☁️</div>
                    <div class="line"></div>
                </div>
                <div class="device" id="device-laptop-b" style="width: 80px; padding: 0.5rem;">
                    <div class="icon" style="font-size: 2rem;">🖥️</div>
                    <span style="font-size:0.7rem">Laptop B</span>
                </div>
            </div>
            `;
    }

    scenario.steps.forEach((step) => {
      html += `
                <div class="step ${step.id === 1 ? "active" : ""}" data-step="${
        step.id
      }">
                    <h4>${step.title}</h4>
                    <p>${step.desc}</p>
                    <code class="command-hint">${step.hint}</code>
                </div>
            `;
    });
    guideContent.innerHTML = html;

    // re-attach hint listeners
    document.querySelectorAll(".command-hint").forEach((hint) => {
      hint.addEventListener("click", () => {
        input.value = hint.textContent;
        input.focus();
      });
    });

    writeLine(
      scenarioName === "local"
        ? "Welcome to Docker Simulator v1.0.0"
        : "Local Terminal (Windows/Mac/Linux)"
    );
    updatePrompt();
  }

  function updatePrompt() {
    const promptSpan = document.querySelector(".input-line .prompt");
    const titleSpan = document.querySelector(".terminal-header .title");

    let p = "$";
    let t = "user@dockersim: ~";

    if (isConnectedToEc2) {
      if (currentScenario === "aws") {
        p = "[ec2-user@ip-172-31-0-1 ~]$";
        t = "ec2-user@ip-172-31-0-1: ~";
      } else if (currentScenario === "ecr") {
        p = "root@prod-server:~#";
        t = "root@prod-server: ~";
      } else if (currentScenario === "masterclass") {
        p = "student@laptop-b:~$";
        t = "student@laptop-b: ~";
      }
    }

    promptSpan.textContent = p;
    titleSpan.textContent = t;
  }

  // focus input always
  document
    .querySelector(".terminal-window")
    .addEventListener("click", () => input.focus());

  // handle user typing
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = input.value.trim();
      if (command) {
        history.push(command);
        historyIndex = history.length;

        const promptSpan = document.querySelector(".input-line .prompt");
        writeLine(`${promptSpan.textContent} ${command}`);

        processCommand(command);
        input.value = "";
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        input.value = "";
      }
    }
  });

  function writeLine(text, className = "") {
    const div = document.createElement("div");
    div.className = `line ${className}`;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  // the brain of the terminal
  function processCommand(cmd) {
    const parts = cmd.split(" ").filter((p) => p.length > 0);
    const base = parts[0];

    if (base === "clear") {
      output.innerHTML = "";
      return;
    }
    if (base === "help") {
      writeLine(
        "Available commands: docker, ls, cat, clear, help, ssh, sudo, aws"
      );
      return;
    }

    // --- Scenario Specific Logic ---

    // ECR Mission
    if (currentScenario === "ecr") {
      if (currentStep === 1 && base === "docker" && parts[1] === "build") {
        writeLine("Sending build context to Docker daemon  2.048kB");
        writeLine("Step 1/5 : FROM node:18-alpine");
        writeLine("Successfully built 123456789abc");
        writeLine("Successfully tagged my-app:latest");
        checkStep(1);
        return;
      }
      if (currentStep === 2 && cmd.includes("aws ecr get-login-password")) {
        writeLine("Login Succeeded");
        checkStep(2);
        return;
      }
      if (currentStep === 3 && base === "docker" && parts[1] === "tag") {
        checkStep(3);
        return;
      }
      if (currentStep === 4 && base === "docker" && parts[1] === "push") {
        writeLine(
          "The push refers to repository [12345.dkr.ecr.us-east-1.amazonaws.com/my-app]"
        );
        writeLine("5f70bf18a086: Pushed");
        writeLine("latest: digest: sha256:8b92... size: 528");
        checkStep(4);
        return;
      }
      if (
        currentStep === 5 &&
        base === "ssh" &&
        parts[1] === "production-server"
      ) {
        writeLine("Connecting to production-server...");
        writeLine("Welcome to Ubuntu 20.04.3 LTS");
        isConnectedToEc2 = true;
        updatePrompt();
        checkStep(5);
        return;
      }
      if (
        currentStep === 6 &&
        isConnectedToEc2 &&
        base === "docker" &&
        parts[1] === "run"
      ) {
        writeLine("Unable to find image locally");
        writeLine("Pulling from 12345.dkr.ecr.us-east-1.amazonaws.com/my-app");
        writeLine("Status: Downloaded newer image");
        writeLine("a1b2c3d4e5f6g7h8");
        checkStep(6);
        return;
      }
    }

    // AWS Mission
    if (currentScenario === "aws") {
      if (
        !isConnectedToEc2 &&
        currentStep === 2 &&
        base === "aws" &&
        parts[1] === "ec2" &&
        parts[2] === "run-instances"
      ) {
        writeLine(
          "Instance launched successfully. Public IP assigned: 54.123.45.67"
        );
        checkStep(2);
        return;
      }
      if (
        !isConnectedToEc2 &&
        currentStep === 1 &&
        base === "aws" &&
        parts[1] === "configure"
      ) {
        writeLine("AWS Access Key ID [None]: ****************ABCD");
        checkStep(1);
        return;
      }
      if (!isConnectedToEc2 && base === "ssh") {
        if (cmd.includes("key.pem") && cmd.includes("@")) {
          writeLine(
            "Warning: Permanently added '54.123.45.67' to the list of known hosts."
          );
          isConnectedToEc2 = true;
          updatePrompt();
          checkStep(3);
          return;
        } else {
          writeLine(
            "ssh: Could not resolve hostname: Name or service not known"
          );
          return;
        }
      }
      if (isConnectedToEc2) {
        if (base === "ls") {
          writeLine("docker-compose.yaml  frontend/  backend/  README.md");
          if (currentStep === 4) checkStep(4);
          return;
        }
        if (
          base === "sudo" &&
          parts[1] === "docker-compose" &&
          parts[2] === "up"
        ) {
          writeLine(
            'Creating network "my-fullstack-app_default" with the default driver'
          );
          writeLine("Creating db ... done");
          state.containers = [
            {
              id: "a1b2c3d4e5",
              image: "my-app-frontend",
              command: "nginx -g",
              created: "Just now",
              status: "Up 2s",
              ports: "0.0.0.0:80->80/tcp",
            },
            {
              id: "f6e5d4c3b2",
              image: "my-app-backend",
              command: "node server.js",
              created: "Just now",
              status: "Up 2s",
              ports: "3000/tcp",
            },
            {
              id: "1a2b3c4d5e",
              image: "mongo:latest",
              command: "docker-entrypoint...",
              created: "Just now",
              status: "Up 2s",
              ports: "27017/tcp",
            },
          ];
          checkStep(5);
          return;
        }
        if (base === "exit") {
          isConnectedToEc2 = false;
          writeLine("logout");
          updatePrompt();
          return;
        }
      }
    }

    // Masterclass Mission
    if (currentScenario === "masterclass") {
      if (currentStep === 1 && base === "mkdir" && parts[1] === "myapp") {
        checkStep(1);
        return;
      }
      if (currentStep === 2 && base === "cd" && parts[1] === "myapp") {
        checkStep(2);
        return;
      }
      if (currentStep === 3 && base === "touch") {
        writeLine("Created index.js");
        writeLine("Created Dockerfile");
        checkStep(3);
        return;
      }
      if (currentStep === 4 && base === "docker" && parts[1] === "build") {
        writeLine("Building myapp:latest...");
        writeLine("Successfully tagged myapp:latest");
        checkStep(4);
        return;
      }
      if (currentStep === 5 && base === "docker" && parts[1] === "run") {
        writeLine("Hello from Docker + AWS ECR!");
        checkStep(5);
        return;
      }
      if (currentStep === 6 && cmd.includes("aws ecr create-repository")) {
        writeLine(
          '{ "repository": { "repositoryUri": "196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite" } }'
        );
        checkStep(6);
        return;
      }
      if (currentStep === 7 && cmd.includes("aws ecr get-login-password")) {
        writeLine("Login Succeeded");
        checkStep(7);
        return;
      }
      if (currentStep === 8 && base === "docker" && parts[1] === "tag") {
        checkStep(8);
        return;
      }
      if (currentStep === 9 && base === "docker" && parts[1] === "push") {
        writeLine(
          "The push refers to repository [196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite]"
        );
        writeLine("Layer A: Pushed");

        const packet = document.getElementById("demo-packet");
        if (packet) {
          packet.classList.remove("animate-pull");
          packet.classList.add("animate-push");
        }

        checkStep(9);
        return;
      }
      if (currentStep === 10 && base === "switch-device") {
        writeLine("Switching to Student Laptop (Laptop B)...");
        isConnectedToEc2 = true;
        updatePrompt();
        checkStep(10);
        return;
      }
      if (currentStep === 11 && base === "docker" && parts[1] === "pull") {
        writeLine(
          "Pulling from 196047493457.dkr.ecr.us-east-1.amazonaws.com/mywebsite"
        );
        writeLine("Status: Downloaded newer image");

        const packet = document.getElementById("demo-packet");
        if (packet) {
          packet.classList.remove("animate-push");
          packet.classList.add("animate-pull");
        }

        checkStep(11);
        return;
      }
      if (currentStep === 12 && base === "docker" && parts[1] === "run") {
        writeLine("Starting container mywebsite_from_ecr...");
        writeLine("Container ID: abc123456789");
        checkStep(12);
        return;
      }
    }

    // --- Standard Commands (Fallbacks) ---
    if (base === "docker") {
      if (currentScenario === "aws" && isConnectedToEc2) {
        writeLine('Try "sudo docker" instead.');
        return;
      }
      handleDockerCommand(parts.slice(1));
      return;
    }

    if (base === "ls") {
      writeLine("Dockerfile  package.json  src/  README.md");
      return;
    }
    if (base === "mkdir") {
      parts[1] ? writeLine("") : writeLine("mkdir: missing operand");
      return;
    }
    if (base === "cd") {
      parts[1] ? writeLine("") : null;
      return;
    }
    if (base === "touch") {
      parts[1] ? writeLine("") : writeLine("touch: missing file operand");
      return;
    }
    if (base === "pwd") {
      writeLine("/home/user");
      return;
    }
    if (base === "sudo" && parts[1] === "docker") {
      handleDockerCommand(parts.slice(2));
      return;
    }

    writeLine(`bash: ${base}: command not found`);
  }

  function handleDockerCommand(args) {
    if (args.length === 0) {
      writeLine("Usage: docker [OPTIONS] COMMAND");
      return;
    }
    const subCmd = args[0];

    if (subCmd === "run") {
      const image = args[args.length - 1];
      if (image.includes("hello-world")) {
        writeLine("Hello from Docker!");
        if (currentScenario === "local") checkStep(1);
      } else if (image === "nginx") {
        if (args.includes("-d")) {
          const id = "f7e8d9c0b1a2";
          writeLine(id);
          state.containers.push({
            id: id.substring(0, 12),
            image: "nginx",
            command: "/docker-entry...",
            created: "Just now",
            status: "Up 1s",
            ports: "0.0.0.0:8080->80/tcp",
          });
          state.running.push(id);
          if (currentScenario === "local") checkStep(3);
        } else {
          writeLine("... (Running Nginx in foreground - Press Ctrl+C to stop)");
        }
      } else {
        writeLine(`Unable to find image '${image}:latest' locally...`);
      }
    } else if (subCmd === "ps") {
      const showAll = args.includes("-a");
      writeLine(
        "CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS                      PORTS"
      );
      const list = showAll
        ? state.containers
        : state.containers.filter((c) => c.status.startsWith("Up"));
      list.forEach((c) => {
        writeLine(
          `${c.id}   ${c.image.padEnd(13)} ${c.command.padEnd(
            24
          )} ${c.created.padEnd(16)} ${c.status.padEnd(27)} ${c.ports}`
        );
      });
      if (currentScenario === "local") {
        if (showAll && currentStep === 2) checkStep(2);
        if (!showAll && currentStep === 4) checkStep(4);
      }
      if (
        currentScenario === "aws" &&
        currentStep === 6 &&
        state.containers.length >= 3
      )
        checkStep(6);
    } else if (subCmd === "build") {
      writeLine("Successfully built def012345678");
      writeLine("Successfully tagged my-app:latest");
    } else {
      writeLine(`docker: '${subCmd}' is not a docker command.`);
    }
  }

  function checkStep(stepNum) {
    if (currentStep === stepNum) {
      const currentEl = document.querySelector(`.step[data-step="${stepNum}"]`);
      if (currentEl) {
        currentEl.classList.remove("active");
        currentEl.style.opacity = "0.5";
        currentEl.innerHTML += " ✅";
      }
      currentStep++;
      const nextEl = document.querySelector(
        `.step[data-step="${currentStep}"]`
      );
      if (nextEl) {
        nextEl.classList.add("active");
        nextEl.style.opacity = "1";
      } else {
        feedback.innerHTML =
          '<div style="color: #22c55e; margin-top: 1rem; font-weight: bold;">🎉 Mission Complete!</div>';
      }
    }
  }

  // start with local
  loadScenario("local");
}

// --- Dockerfile Interactions (Clicky Clicky) ---
function setupDockerfileInteractions() {
  window.highlightLine = function (keyword) {
    const explanations = {
      FROM: "FROM: Initializes a new build stage and sets the Base Image.",
      WORKDIR: "WORKDIR: Sets the working directory.",
      COPY: "COPY: Copies new files or directories from <src> to <dest>.",
      RUN: "RUN: Executes any commands in a new layer.",
      EXPOSE:
        "EXPOSE: Informs Docker that the container listens on the specified network ports.",
      CMD: "CMD: The main purpose of a CMD is to provide defaults for an executing container.",
    };
    const panel = document.querySelector(".explanation-panel p");
    if (panel && explanations[keyword]) {
      panel.textContent = explanations[keyword];
      panel.style.fontWeight = "700";
    }
  };
}

// --- Theme Toggle (Dark Mode Goes Brrr) ---
function setupThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    toggleBtn.classList.add("toggled-right");
  }
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    toggleBtn.classList.toggle("toggled-right");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  });
}
