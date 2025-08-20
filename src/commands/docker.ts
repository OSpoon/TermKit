import type { CommandItem } from './types'

// Docker Commands - Container and image management
export const DOCKER_COMMANDS: CommandItem[] = [
  {
    label: 'List Images',
    command: 'docker images',
    description: 'List all Docker images',
    category: 'docker',
  },
  {
    label: 'List Containers',
    command: 'docker ps -a',
    description: 'List all containers',
    category: 'docker',
  },
  {
    label: 'Running Containers',
    command: 'docker ps',
    description: 'List running containers',
    category: 'docker',
  },
  {
    label: 'Build Image',
    command: 'docker build -t image_name .',
    description: 'Build Docker image from Dockerfile',
    category: 'docker',
  },
  {
    label: 'Run Container',
    command: 'docker run -it image_name',
    description: 'Run container interactively',
    category: 'docker',
  },
  {
    label: 'Run with Port',
    command: 'docker run -p 8080:80 image_name',
    description: 'Run container with port mapping',
    category: 'docker',
  },
  {
    label: 'Start Container',
    command: 'docker start container_id',
    description: 'Start a stopped container',
    category: 'docker',
  },
  {
    label: 'Stop Container',
    command: 'docker stop container_id',
    description: 'Stop a running container',
    category: 'docker',
  },
  {
    label: 'Remove Container',
    command: 'docker rm container_id',
    description: 'Remove a container',
    category: 'docker',
  },
  {
    label: 'Remove Image',
    command: 'docker rmi image_id',
    description: 'Remove a Docker image',
    category: 'docker',
  },
  {
    label: 'Pull Image',
    command: 'docker pull image_name',
    description: 'Pull image from registry',
    category: 'docker',
  },
  {
    label: 'Push Image',
    command: 'docker push image_name',
    description: 'Push image to registry',
    category: 'docker',
  },
  {
    label: 'Execute in Container',
    command: 'docker exec -it container_id bash',
    description: 'Execute command in running container',
    category: 'docker',
  },
  {
    label: 'View Logs',
    command: 'docker logs container_id',
    description: 'View container logs',
    category: 'docker',
  },
  {
    label: 'System Prune',
    command: 'docker system prune',
    description: 'Remove unused Docker objects',
    category: 'docker',
  },
  {
    label: 'Docker Compose Up',
    command: 'docker-compose up -d',
    description: 'Start services with docker-compose',
    category: 'docker',
  },
  {
    label: 'Docker Compose Down',
    command: 'docker-compose down',
    description: 'Stop services with docker-compose',
    category: 'docker',
  },
  {
    label: 'Docker Volume List',
    command: 'docker volume ls',
    description: 'List Docker volumes',
    category: 'docker',
  },
  {
    label: 'Docker Network List',
    command: 'docker network ls',
    description: 'List Docker networks',
    category: 'docker',
  },
  {
    label: 'Docker Stats',
    command: 'docker stats',
    description: 'Show container resource usage',
    category: 'docker',
  },
]
