/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Org, SfProject } from '@salesforce/core';
import {
  SourceTracking,
  SourceTrackingOptions
} from '@salesforce/source-tracking';
import { getRootWorkspacePath, OrgAuthInfo } from '../util';
import { SourceStatusSummary } from './sourceStatusSummary';

export class SourceTrackingService {
  private _sourceTracking: SourceTracking | undefined;

  public constructor(sourceTracking?: SourceTracking) {
    if (sourceTracking !== undefined) {
      this._sourceTracking = sourceTracking;
    }
  }

  public getSourceStatusSummary = async ({
    local = true,
    remote = true
  }): Promise<string> => {
    const statusResponse = await (await this.sourceTracking()).getStatus({
      local,
      remote
    });
    const sourceStatusSummary: SourceStatusSummary = new SourceStatusSummary(
      statusResponse
    );
    return sourceStatusSummary.format();
  };

  private async sourceTracking() {
    if (this._sourceTracking === undefined) {
      this._sourceTracking = await this.createSourceTracking();
    }
    return this._sourceTracking;
  }

  private async createSourceTracking(): Promise<SourceTracking> {
    const projectPath = getRootWorkspacePath();
    const username = await OrgAuthInfo.getDefaultUsernameOrAlias(false);
    const org: Org = await Org.create({ aliasOrUsername: username });
    const project = await SfProject.resolve(projectPath);
    const options: SourceTrackingOptions = {
      org,
      project,
      ignoreLocalCache: true
    };

    // Change the environment to get the node process to use
    // the correct current working directory (process.cwd).
    // Without this, process.cwd() returns "'/'" and SourceTracking.create() fails.
    process.chdir(projectPath);
    const tracking = await SourceTracking.create(options);
    return tracking;
  }
}
