#!/usr/bin/env node

import { program } from "commander";
import { run } from "./run.ts";

program
  .name("create-mern-stacker")
  .argument("[project-name]")
  .action(run);

program.parse();
