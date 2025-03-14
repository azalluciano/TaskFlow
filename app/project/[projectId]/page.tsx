"use client";
import { getProjectInfo } from "@/app/action";
import ProjectCard from "@/app/components/ProjectCard";
import UserInfo from "@/app/components/UserInfo";
import Wrapper from "@/app/components/Wrapper";
import { Project } from "@/type";
import { useUser } from "@clerk/nextjs";
import { CopyPlus } from "lucide-react";
import Link from "next/link";

import React, { useEffect, useState } from "react";

const page = ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<Project | null>(null);

  const fetchInfos = async (projectId: string) => {
    console.log("qqscqscqdc", projectId);
    try {
      const project = await getProjectInfo(projectId, true);

      setProject(project);
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
    }
  };

  useEffect(() => {
    const getId = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.projectId);
      fetchInfos(resolvedParams.projectId);
    };
    getId();
  }, [params]);
  useEffect(() => {
    if (project && project.tasks) {
      const counts = {
        todo: project.tasks.filter((task) => task.status == "To Do").length,
        inProgress: project.tasks.filter((task) => task.status == "In Progress")
          .length,
        done: project.tasks.filter((task) => task.status == "Done").length,
      };
    }
  }, [params]);
  console.log("project", project);

  return (
    <Wrapper>
      <div className="md:flex md:flex-row flex-col">
        <div className="md:w-1/4">
          {" "}
          <div className="p-5 border border-base-300 rounded-xl mb-6">
            <UserInfo
              role="Crée par"
              email={project?.createdBy?.email || null}
              name={project?.createdBy?.name || null}
            />
          </div>
          <div className="w-full">
            {project && (
              <ProjectCard project={project} admin={0} style={false} />
            )}
          </div>
        </div>
        <div className="mt-6 md:ml-6 md:mt-0 md:w-3/4">
          <div className="md:flex md:justify-between">
            <Link
              href={`/new-tasks/${projectId}`}
              className="btn btn-sm btn-secondary mt-2 md:mt-0"
            >
              Nouvelle tâche <CopyPlus className="w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default page;
