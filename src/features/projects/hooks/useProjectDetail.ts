
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../api/projects.api';
import { tasksService } from '@/features/tasks/api/tasks.api';
import { issuesService } from '@/features/issues/api/issues.api';
import { milestonesService } from '@/features/milestones/api/milestones.api';
import { timelogsService } from '@/features/timelogs/api/timelogs.api';
import { projectKeys } from './useProjects';

import { tasklistsService } from '@/api/services/tasklists.service';

const STALE = 0; // Data should be considered stale immediately to ensure updates are reflected

export function useProjectDetail(projectId: number | undefined) {
    const enabled = !!projectId;

    const project = useQuery({
        queryKey: projectKeys.detail(projectId!),
        queryFn: () => projectsService.getProject(projectId!),
        enabled,
        staleTime: STALE,
    });

    const tasks = useQuery({
        queryKey: [...projectKeys.detail(projectId!), 'tasks'],
        queryFn: () => tasksService.getTasks({ project_id: projectId, skip: 0, limit: 200 }),
        enabled,
        staleTime: STALE,
    });

    const taskLists = useQuery({
        queryKey: [...projectKeys.detail(projectId!), 'tasklists'],
        queryFn: () => tasklistsService.getTaskLists(projectId!, 0, 500),
        enabled,
        staleTime: STALE,
    });

    const issues = useQuery({
        queryKey: [...projectKeys.detail(projectId!), 'issues'],
        queryFn: () => issuesService.getIssues({ project_id: projectId, skip: 0, limit: 200 }),
        enabled,
        staleTime: STALE,
    });

    const milestones = useQuery({
        queryKey: [...projectKeys.detail(projectId!), 'milestones'],
        queryFn: () => milestonesService.getMilestones(projectId!),
        enabled,
        staleTime: STALE,
    });

    const timelogs = useQuery({
        queryKey: [...projectKeys.detail(projectId!), 'timelogs'],
        queryFn: () => timelogsService.getTimelogs(0, 1000, projectId!),
        enabled,
        staleTime: STALE,
    });

    const isLoading =
        project.isLoading ||
        tasks.isLoading ||
        taskLists.isLoading ||
        issues.isLoading ||
        milestones.isLoading ||
        timelogs.isLoading;

    const isError =
        project.isError ||
        tasks.isError ||
        taskLists.isError ||
        issues.isError ||
        milestones.isError ||
        timelogs.isError;

    return {
        project: project.data,
        tasks: tasks.data?.items ?? [],
        taskTotal: tasks.data?.total ?? 0,
        taskLists: taskLists.data ?? [],
        issues: issues.data?.items ?? [],
        issueTotal: issues.data?.total ?? 0,
        milestones: milestones.data ?? [],
        timelogs: timelogs.data ?? [],
        isLoading,
        isError,
        refetchAll: () => {
            project.refetch();
            tasks.refetch();
            taskLists.refetch();
            issues.refetch();
            milestones.refetch();
            timelogs.refetch();
        },
    };
}
