document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupSimulator();
    setupDockerfileInteractions();
    setupVisualBuilder();
});

// --- Visual Builder Logic ---
function setupVisualBuilder() {
    const nextBtn = document.getElementById('next-build-btn');
    const stepNum = document.getElementById('build-step-num');
    const desc = document.getElementById('build-description');
    const contextBox = document.getElementById('context-box');
    const imageStack = document.getElementById('image-stack');
    
    let currentBuildStep = 0;

    const steps = [
        {
            desc: "Step 1: Sending build context to Docker daemon...",
            action: () => {
                // Animate files moving to context
                document.getElementById('file-pkg').style.transform = 'translate(180%, 50px) rotate(5deg)';
                document.getElementById('file-src').style.transform = 'translate(180%, 0px) rotate(-5deg)';
                document.getElementById('file-docker').style.transform = 'translate(180%, -50px) rotate(2deg)';
                
                setTimeout(() => {
                    contextBox.classList.add('processing');
                    contextBox.innerHTML = '<span class="label" style="color:#000">Context Received (25KB)</span>';
                }, 600);
            }
        },
        {
            desc: "Step 2: FROM node:18-alpine",
            action: () => {
                addLayer("Base Image: Node 18 Alpine", "#fff");
            }
        },
        {
            desc: "Step 3: WORKDIR /app & COPY package.json",
            action: () => {
                addLayer("Layer: /app created", "#eee");
            }
        },
        {
            desc: "Step 4: RUN npm install",
            action: () => {
                contextBox.classList.add('processing');
                desc.textContent = "Installing dependencies... (npm install)";
                setTimeout(() => {
                    contextBox.classList.remove('processing');
                    addLayer("Layer: node_modules", "#ddd");
                }, 1000);
            }
        },
        {
            desc: "Step 5: COPY . . & CMD",
            action: () => {
                addLayer("Layer: App Source Code", "#ccc");
                setTimeout(() => {
                    alert("Build Complete! Image tagged as 'my-web-app:latest'");
                    nextBtn.textContent = "Reset Build";
                }, 500);
            }
        }
    ];

    function addLayer(text, bg) {
        const div = document.createElement('div');
        div.className = 'image-layer';
        div.textContent = text;
        div.style.background = bg;
        imageStack.appendChild(div);
    }

    nextBtn.addEventListener('click', () => {
        if (currentBuildStep >= steps.length) {
            // Reset
            currentBuildStep = 0;
            stepNum.textContent = "0";
            desc.textContent = "Ready to start building...";
            nextBtn.textContent = "Start Build";
            imageStack.innerHTML = '';
            contextBox.innerHTML = '<span class="label">Build Context</span>';
            contextBox.classList.remove('processing');
            
            // Reset transforms
            ['file-pkg', 'file-src', 'file-docker'].forEach(id => {
                document.getElementById(id).style.transform = 'none';
            });
            return;
        }

        const step = steps[currentBuildStep];
        desc.textContent = step.desc;
        step.action();
        
        currentBuildStep++;
        stepNum.textContent = currentBuildStep;
        
        if (currentBuildStep < steps.length) {
            nextBtn.textContent = "Next Step";
        } else {
            nextBtn.textContent = "Finish";
        }
    });
}

// --- Navigation ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Section
            const targetId = item.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });
}

function navigateTo(sectionId) {
    const navItem = document.querySelector(`.nav-links li[data-section="${sectionId}"]`);
    if (navItem) navItem.click();
}

// --- Simulator Logic ---
function setupSimulator() {
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const guideContent = document.getElementById('guide-content');
    const feedback = document.getElementById('feedback-area');
    
    let currentScenario = 'local'; // 'local', 'aws', or 'ecr'
    let currentStep = 1;
    let isConnectedToEc2 = false;

    // Fake State
    const state = {
        containers: [],
        images: ['hello-world:latest', 'nginx:latest', 'node:18-alpine'],
        running: []
    };

    // Command History
    let history = [];
    let historyIndex = -1;

    // Scenarios Configuration
    const scenarios = {
        local: {
            title: "Local Docker Basics",
            steps: [
                { id: 1, title: "Step 1: Hello World", desc: "Pull and run a simple image to verify installation.", hint: "docker run hello-world" },
                { id: 2, title: "Step 2: List Containers", desc: "See what containers have run (including stopped ones).", hint: "docker ps -a" },
                { id: 3, title: "Step 3: Run a Web Server", desc: "Run an Nginx server in detached mode.", hint: "docker run -d -p 8080:80 nginx" },
                { id: 4, title: "Step 4: Check Running Containers", desc: "See the currently running Nginx container.", hint: "docker ps" }
            ]
        },
        aws: {
            title: "AWS Full Stack Mission",
            steps: [
                { id: 1, title: "Step 1: Configure AWS", desc: "Set up your AWS credentials to manage the account.", hint: "aws configure" },
                { id: 2, title: "Step 2: Launch Instance", desc: "Use CLI to launch a new EC2 instance.", hint: "aws ec2 run-instances --image-id ami-12345 --count 1 --instance-type t2.micro" },
                { id: 3, title: "Step 3: Connect to Server", desc: "SSH into your new production instance.", hint: "ssh -i key.pem user@54.123.45.67" },
                { id: 4, title: "Step 4: Verify Files", desc: "Check if the project files are present on the server.", hint: "ls" },
                { id: 5, title: "Step 5: Deploy Stack", desc: "Start the full stack application using Docker Compose.", hint: "sudo docker-compose up -d" },
                { id: 6, title: "Step 6: Verify Deployment", desc: "Check if all 3 containers (Frontend, Backend, DB) are running.", hint: "sudo docker ps" }
            ]
        },
        ecr: {
            title: "AWS ECR Distribution Mission",
            steps: [
                { id: 1, title: "Step 1: Build Image", desc: "Build your local application image.", hint: "docker build -t my-app ." },
                { id: 2, title: "Step 2: ECR Login", desc: "Authenticate Docker with your AWS ECR registry.", hint: "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 12345.dkr.ecr.us-east-1.amazonaws.com" },
                { id: 3, title: "Step 3: Tag Image", desc: "Tag your image with the full ECR repository URL.", hint: "docker tag my-app:latest 12345.dkr.ecr.us-east-1.amazonaws.com/my-app:latest" },
                { id: 4, title: "Step 4: Push to Cloud", desc: "Upload your image to AWS ECR.", hint: "docker push 12345.dkr.ecr.us-east-1.amazonaws.com/my-app:latest" },
                { id: 5, title: "Step 5: Switch Device", desc: "Simulate switching to a production server.", hint: "ssh production-server" },
                { id: 6, title: "Step 6: Pull & Run", desc: "Download and run your image from the cloud.", hint: "docker run -d -p 80:80 12345.dkr.ecr.us-east-1.amazonaws.com/my-app:latest" }
            ]
        }
    };

    // Expose startAwsMission globally
    window.startAwsMission = function() {
        navigateTo('simulator');
        loadScenario('aws');
    };

    window.startEcrMission = function() {
        navigateTo('simulator');
        loadScenario('ecr');
    };

    function loadScenario(scenarioName) {
        currentScenario = scenarioName;
        currentStep = 1;
        isConnectedToEc2 = false;
        output.innerHTML = '';
        feedback.innerHTML = '';
        
        // Reset State
        state.containers = [];
        state.running = [];
        
        // Update Guide
        const scenario = scenarios[scenarioName];
        document.querySelector('.guide-panel h3').textContent = scenario.title;
        
        let introText = "Welcome to Docker Simulator.";
        if (scenarioName === 'aws') introText = "Mission: Deploy Full Stack App to AWS.";
        if (scenarioName === 'ecr') introText = "Mission: Distribute Image via AWS ECR.";
        
        let html = `<p>${introText}</p>`;
        scenario.steps.forEach(step => {
            html += `
                <div class="step ${step.id === 1 ? 'active' : ''}" data-step="${step.id}">
                    <h4>${step.title}</h4>
                    <p>${step.desc}</p>
                    <code class="command-hint">${step.hint}</code>
                </div>
            `;
        });
        guideContent.innerHTML = html;

        // Re-attach hint listeners
        document.querySelectorAll('.command-hint').forEach(hint => {
            hint.addEventListener('click', () => {
                input.value = hint.textContent;
                input.focus();
            });
        });

        writeLine(scenarioName === 'local' ? "Welcome to Docker Simulator v1.0.0" : "Local Terminal (Windows/Mac/Linux)");
        updatePrompt();
    }

    function updatePrompt() {
        const promptSpan = document.querySelector('.input-line .prompt');
        const titleSpan = document.querySelector('.terminal-header .title');
        
        if (currentScenario === 'aws' && isConnectedToEc2) {
            promptSpan.textContent = "[ec2-user@ip-172-31-0-1 ~]$";
            titleSpan.textContent = "ec2-user@ip-172-31-0-1: ~";
        } else if (currentScenario === 'ecr' && isConnectedToEc2) {
            promptSpan.textContent = "root@prod-server:~#";
            titleSpan.textContent = "root@prod-server: ~";
        } else {
            promptSpan.textContent = "$";
            titleSpan.textContent = "user@dockersim: ~";
        }
    }

    // Focus input on click anywhere in terminal
    document.querySelector('.terminal-window').addEventListener('click', () => {
        input.focus();
    });

    // Handle Input
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                history.push(command);
                historyIndex = history.length;
                
                // Write the command line with the correct prompt
                let promptText = "$";
                if (currentScenario === 'aws' && isConnectedToEc2) promptText = "[ec2-user@ip-172-31-0-1 ~]$";
                if (currentScenario === 'ecr' && isConnectedToEc2) promptText = "root@prod-server:~#";
                
                writeLine(`${promptText} ${command}`);
                
                processCommand(command);
                input.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = history[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                input.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                input.value = '';
            }
        }
    });

    function writeLine(text, className = '') {
        const div = document.createElement('div');
        div.className = `line ${className}`;
        div.textContent = text;
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
    }

    function processCommand(cmd) {
        const parts = cmd.split(' ').filter(p => p.length > 0);
        const base = parts[0];

        if (base === 'clear') {
            output.innerHTML = '';
            return;
        }

        if (base === 'help') {
            writeLine('Available commands: docker, ls, cat, clear, help, ssh, sudo, aws');
            return;
        }

        // ECR Scenario Specifics
        if (currentScenario === 'ecr') {
            // Step 1: Build
            if (currentStep === 1 && base === 'docker' && parts[1] === 'build') {
                writeLine('Sending build context to Docker daemon  2.048kB');
                writeLine('Step 1/5 : FROM node:18-alpine');
                writeLine('Successfully built 123456789abc');
                writeLine('Successfully tagged my-app:latest');
                checkStep(1);
                return;
            }

            // Step 2: Login
            if (currentStep === 2 && cmd.includes('aws ecr get-login-password')) {
                writeLine('Login Succeeded');
                checkStep(2);
                return;
            }

            // Step 3: Tag
            if (currentStep === 3 && base === 'docker' && parts[1] === 'tag') {
                checkStep(3);
                return;
            }

            // Step 4: Push
            if (currentStep === 4 && base === 'docker' && parts[1] === 'push') {
                writeLine('The push refers to repository [12345.dkr.ecr.us-east-1.amazonaws.com/my-app]');
                writeLine('5f70bf18a086: Pushed');
                writeLine('24302eb7d908: Pushed');
                writeLine('latest: digest: sha256:8b92b7269f59e3ed... size: 528');
                checkStep(4);
                return;
            }

            // Step 5: Switch Device (SSH)
            if (currentStep === 5 && base === 'ssh' && parts[1] === 'production-server') {
                writeLine('Connecting to production-server...');
                writeLine('Welcome to Ubuntu 20.04.3 LTS (GNU/Linux 5.4.0-1045-aws x86_64)');
                isConnectedToEc2 = true;
                updatePrompt();
                checkStep(5);
                return;
            }

            // Step 6: Pull & Run
            if (currentStep === 6 && isConnectedToEc2 && base === 'docker' && parts[1] === 'run') {
                writeLine('Unable to find image locally');
                writeLine('Pulling from 12345.dkr.ecr.us-east-1.amazonaws.com/my-app');
                writeLine('Digest: sha256:8b92b7269f59e3ed...');
                writeLine('Status: Downloaded newer image');
                writeLine('a1b2c3d4e5f6g7h8'); // Container ID
                checkStep(6);
                return;
            }
        }

        // AWS Scenario Specifics
        if (currentScenario === 'aws') {
            // Step 2: Launch Instance
            if (!isConnectedToEc2 && currentStep === 2) {
                if (base === 'aws' && parts[1] === 'ec2' && parts[2] === 'run-instances') {
                    writeLine('{');
                    writeLine('    "Instances": [');
                    writeLine('        {');
                    writeLine('            "InstanceId": "i-1234567890abcdef0",');
                    writeLine('            "InstanceType": "t2.micro",');
                    writeLine('            "State": { "Name": "pending" }');
                    writeLine('        }');
                    writeLine('    ]');
                    writeLine('}');
                    writeLine('Instance launched successfully. Public IP assigned: 54.123.45.67');
                    checkStep(2);
                    return;
                }
            }
            
            // Step 1: aws configure
            if (!isConnectedToEc2 && currentStep === 1) {
                if (base === 'aws' && parts[1] === 'configure') {
                    writeLine('AWS Access Key ID [None]: ****************ABCD');
                    writeLine('AWS Secret Access Key [None]: ************************XYZ');
                    writeLine('Default region name [None]: us-east-1');
                    writeLine('Default output format [None]: json');
                    checkStep(1);
                    return;
                }
            }

            // Step 3: SSH
            if (!isConnectedToEc2) {
                if (base === 'ssh') {
                    if (cmd.includes('key.pem') && cmd.includes('@')) {
                        writeLine('The authenticity of host \'54.123.45.67\' can\'t be established.');
                        writeLine('ECDSA key fingerprint is SHA256:...');
                        writeLine('Are you sure you want to continue connecting (yes/no)? yes');
                        writeLine('Warning: Permanently added \'54.123.45.67\' to the list of known hosts.');
                        writeLine('');
                        writeLine('       __|  __|_  )');
                        writeLine('       _|  (     /   Amazon Linux 2 AMI');
                        writeLine('      ___|\\___|___|');
                        writeLine('');
                        isConnectedToEc2 = true;
                        updatePrompt();
                        checkStep(3);
                        return;
                    } else {
                        writeLine('ssh: Could not resolve hostname: Name or service not known');
                        return;
                    }
                }
            } else {
                // Connected to EC2
                if (base === 'ls') {
                    writeLine('docker-compose.yaml  frontend/  backend/  README.md');
                    if (currentStep === 4) checkStep(4);
                    return;
                }

                if (base === 'sudo') {
                    const sudoCmd = parts[1];
                    
                    // docker-compose up
                    if (sudoCmd === 'docker-compose' && parts[2] === 'up') {
                        writeLine('Creating network "my-fullstack-app_default" with the default driver');
                        writeLine('Creating db ... done');
                        writeLine('Creating backend ... done');
                        writeLine('Creating frontend ... done');
                        
                        // Add fake containers
                        state.containers = [
                            { id: 'a1b2c3d4e5', image: 'my-app-frontend', command: 'nginx -g', created: 'Just now', status: 'Up 2 seconds', ports: '0.0.0.0:80->80/tcp' },
                            { id: 'f6e5d4c3b2', image: 'my-app-backend', command: 'node server.js', created: 'Just now', status: 'Up 2 seconds', ports: '3000/tcp' },
                            { id: '1a2b3c4d5e', image: 'mongo:latest', command: 'docker-entrypoint...', created: 'Just now', status: 'Up 2 seconds', ports: '27017/tcp' }
                        ];
                        
                        checkStep(5);
                        return;
                    }

                    if (sudoCmd === 'docker') {
                        handleDockerCommand(parts.slice(2)); // Pass args after 'sudo docker'
                        return;
                    }
                }
                
                if (base === 'exit') {
                    isConnectedToEc2 = false;
                    writeLine('logout');
                    writeLine('Connection to 54.123.45.67 closed.');
                    updatePrompt();
                    return;
                }
            }
        }

        // Standard Docker Commands (Local or Remote if Docker is installed)
        if (base === 'docker') {
            if (currentScenario === 'aws' && isConnectedToEc2) {
                 writeLine('docker: permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json": dial unix /var/run/docker.sock: connect: permission denied');
                 writeLine('Try "sudo docker" instead.');
                 return;
            }
            handleDockerCommand(parts.slice(1));
            return;
        }

        if (base === 'ls') {
            writeLine('Dockerfile  package.json  src/  README.md');
            return;
        }

        writeLine(`bash: ${base}: command not found`);
    }

    function handleDockerCommand(args) {
        if (args.length === 0) {
            writeLine('Usage: docker [OPTIONS] COMMAND');
            return;
        }

        const subCmd = args[0];

        // docker run
        if (subCmd === 'run') {
            const image = args[args.length - 1]; 
            
            if (image.includes('hello-world')) {
                writeLine('Unable to find image \'hello-world:latest\' locally');
                writeLine('latest: Pulling from library/hello-world');
                writeLine('Status: Downloaded newer image for hello-world:latest');
                writeLine('\nHello from Docker!');
                
                if (currentScenario === 'local') checkStep(1);
            } 
            else if (image === 'nginx') {
                const isDetached = args.includes('-d');
                if (isDetached) {
                    const id = 'f7e8d9c0b1a2' + Math.floor(Math.random() * 1000);
                    writeLine(id);
                    state.containers.push({
                        id: id.substring(0, 12),
                        image: 'nginx',
                        command: '/docker-entry...',
                        created: 'Just now',
                        status: 'Up 1 second',
                        ports: '0.0.0.0:8080->80/tcp'
                    });
                    state.running.push(id);
                    
                    if (currentScenario === 'local') checkStep(3);
                } else {
                    writeLine('... (Running Nginx in foreground - Press Ctrl+C to stop)');
                }
            }
            else {
                writeLine(`Unable to find image '${image}:latest' locally...`);
                writeLine(`docker: Error response from daemon: pull access denied for ${image}, repository does not exist.`);
            }
        }

        // docker ps
        else if (subCmd === 'ps') {
            const showAll = args.includes('-a');
            
            let header = 'CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS                      PORTS';
            writeLine(header);

            const list = showAll ? state.containers : state.containers.filter(c => c.status.startsWith('Up'));
            
            list.forEach(c => {
                let line = `${c.id}   ${c.image.padEnd(13)} ${c.command.padEnd(24)} ${c.created.padEnd(16)} ${c.status.padEnd(27)} ${c.ports}`;
                writeLine(line);
            });

            if (currentScenario === 'local') {
                if (showAll && currentStep === 2) checkStep(2);
                if (!showAll && currentStep === 4) checkStep(4);
            }
            
            if (currentScenario === 'aws' && currentStep === 6) {
                // Check if we have 3 containers running
                if (state.containers.length >= 3) {
                    checkStep(6);
                }
            }
        }

        // docker build
        else if (subCmd === 'build') {
            writeLine('Sending build context to Docker daemon  2.048kB');
            writeLine('Step 1/5 : FROM node:18-alpine');
            writeLine('Successfully built def012345678');
            writeLine('Successfully tagged my-app:latest');
        }

        else {
            writeLine(`docker: '${subCmd}' is not a docker command.`);
        }
    }

    function checkStep(stepNum) {
        if (currentStep === stepNum) {
            // Mark current as done
            const currentEl = document.querySelector(`.step[data-step="${stepNum}"]`);
            if (currentEl) {
                currentEl.classList.remove('active');
                currentEl.style.opacity = '0.5';
                currentEl.innerHTML += ' ✅';
            }

            currentStep++;
            const nextEl = document.querySelector(`.step[data-step="${currentStep}"]`);
            if (nextEl) {
                nextEl.classList.add('active');
                nextEl.style.opacity = '1';
            } else {
                // Finished
                feedback.innerHTML = '<div style="color: #22c55e; margin-top: 1rem; font-weight: bold;">🎉 Mission Complete!</div>';
            }
        }
    }
    
    // Initialize Local Scenario by default
    loadScenario('local');
}

// --- Dockerfile Interactions ---
function setupDockerfileInteractions() {
    // Just simple highlighting for now
    window.highlightLine = function(keyword) {
        const explanations = {
            'FROM': 'FROM: Initializes a new build stage and sets the Base Image for subsequent instructions. Every Dockerfile must start with a FROM instruction.',
            'WORKDIR': 'WORKDIR: Sets the working directory for any RUN, CMD, ENTRYPOINT, COPY and ADD instructions that follow it.',
            'COPY': 'COPY: Copies new files or directories from <src> and adds them to the filesystem of the container at the path <dest>.',
            'RUN': 'RUN: Executes any commands in a new layer on top of the current image and commits the results.',
            'EXPOSE': 'EXPOSE: Informs Docker that the container listens on the specified network ports at runtime.',
            'CMD': 'CMD: The main purpose of a CMD is to provide defaults for an executing container. There can only be one CMD instruction in a Dockerfile.'
        };

        const panel = document.querySelector('.explanation-panel p');
        if (panel && explanations[keyword]) {
            panel.textContent = explanations[keyword];
            panel.style.color = '#000';
            panel.style.fontWeight = '700';
            setTimeout(() => {
                // panel.style.color = '#000'; // Keep it black
            }, 500);
        }
    };
}
