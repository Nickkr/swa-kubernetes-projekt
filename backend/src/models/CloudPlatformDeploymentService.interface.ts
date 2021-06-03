export interface CloudPlatformDeploymentService {
    getCost: (config: any) => Promise<number>,
    createCluster: (config: any) => Promise<string>,
    removeCluster: (config: any) => void
}