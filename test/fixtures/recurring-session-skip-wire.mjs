// Captured from the local synthetic OAuth + hosted MCP Worker journey, 2026-11-10.
// Canonical DTOs only; no credentials or real account data.
export default {
  request: {
    representationVersion: 1,
    operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
    target: {
      scope: 'project:workouts',
      scheduleId: 'weekly',
      athleteId: 'owner',
      trainingId: 'routine',
    },
  },
  preview: {
    confirmation: {
      occurrenceKey: '20261111T040544Z',
      request: {
        operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
        representationVersion: 1,
        target: {
          athleteId: 'owner',
          scheduleId: 'weekly',
          scope: 'project:workouts',
          trainingId: 'routine',
        },
      },
      scheduleRevision: '2',
      session: {
        decisionRevision: 0,
        epoch: '8f20596d-9343-4d1a-8233-4eb2ea8b7742',
        expectedRevision: null,
        preparedAt: 1794283544577,
        previewKey: '5c274d7081c049db26739f9df8e909d46af877e18f860f0312c2677aae92d2f9',
        request: {
          action: 'skip',
          operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
          representationVersion: 1,
          target: {
            athleteId: 'owner',
            scope: 'project:workouts',
            taskId:
              'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
            trainingId: 'routine',
          },
        },
      },
    },
    occurrenceKey: '20261111T040544Z',
    reason: 'review',
    representationVersion: 1,
    request: {
      operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
      representationVersion: 1,
      target: {
        athleteId: 'owner',
        scheduleId: 'weekly',
        scope: 'project:workouts',
        trainingId: 'routine',
      },
    },
    session: {
      decision: null,
      decisionRevision: 0,
      epoch: '8f20596d-9343-4d1a-8233-4eb2ea8b7742',
      expectedRevision: null,
      expiresAt: 1794283844577,
      key: '5c274d7081c049db26739f9df8e909d46af877e18f860f0312c2677aae92d2f9',
      preparedAt: 1794283544577,
      reason: 'review',
      representationVersion: 1,
      request: {
        action: 'skip',
        operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
        representationVersion: 1,
        target: {
          athleteId: 'owner',
          scope: 'project:workouts',
          taskId:
            'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
          trainingId: 'routine',
        },
      },
      sourceVersion: '8944d5b05f5c7ff567e69412cfe689ad8aafdba63b0e324cc0f23cf5f6b3a74a',
      startsAt: '2026-11-11T04:05:44.000Z',
      state: 'review',
    },
    state: 'review',
  },
  confirmation: {
    occurrenceKey: '20261111T040544Z',
    request: {
      operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
      representationVersion: 1,
      target: {
        athleteId: 'owner',
        scheduleId: 'weekly',
        scope: 'project:workouts',
        trainingId: 'routine',
      },
    },
    scheduleRevision: '2',
    session: {
      decisionRevision: 0,
      epoch: '8f20596d-9343-4d1a-8233-4eb2ea8b7742',
      expectedRevision: null,
      preparedAt: 1794283544577,
      previewKey: '5c274d7081c049db26739f9df8e909d46af877e18f860f0312c2677aae92d2f9',
      request: {
        action: 'skip',
        operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
        representationVersion: 1,
        target: {
          athleteId: 'owner',
          scope: 'project:workouts',
          taskId:
            'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
          trainingId: 'routine',
        },
      },
    },
  },
  result: {
    occurrenceKey: '20261111T040544Z',
    representationVersion: 1,
    request: {
      operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
      representationVersion: 1,
      target: {
        athleteId: 'owner',
        scheduleId: 'weekly',
        scope: 'project:workouts',
        trainingId: 'routine',
      },
    },
    session: {
      cursor: '1',
      decision: {
        actorId: 'owner',
        decidedAt: 1794283544599,
        disposition: 'skipped',
        operationId: '25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
        sourceVersion: '8944d5b05f5c7ff567e69412cfe689ad8aafdba63b0e324cc0f23cf5f6b3a74a',
        startsAt: '2026-11-11T04:05:44.000Z',
        target: {
          athleteId: 'owner',
          scope: 'project:workouts',
          taskId:
            'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
          trainingId: 'routine',
        },
      },
      epoch: '8f20596d-9343-4d1a-8233-4eb2ea8b7742',
      mutationId: 'session-recurrence-skip:25f8217e-73b7-4617-bd72-0fa9d18ee0b6',
      representationVersion: 1,
      revision: '1',
      target: {
        athleteId: 'owner',
        scope: 'project:workouts',
        taskId:
          'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
        trainingId: 'routine',
      },
    },
  },
  materializedRequest: {
    representationVersion: 1,
    operationId: '6a05350e-4c3a-4f61-8b6d-da4fc40eb14c',
    target: {
      scope: 'project:workouts',
      scheduleId: 'weekly',
      athleteId: 'owner',
      trainingId: 'routine',
    },
  },
  materializedPreview: {
    confirmation: null,
    occurrenceKey: '20261111T040544Z',
    reason: 'already_materialized',
    representationVersion: 1,
    request: {
      operationId: '6a05350e-4c3a-4f61-8b6d-da4fc40eb14c',
      representationVersion: 1,
      target: {
        athleteId: 'owner',
        scheduleId: 'weekly',
        scope: 'project:workouts',
        trainingId: 'routine',
      },
    },
    session: {
      decision: {
        actorId: 'owner',
        decidedAt: 1794283544672,
        disposition: 'restored',
        operationId: 'c17b4084-b405-414d-bf0d-06d9d7f6c08e',
        sourceVersion: '8944d5b05f5c7ff567e69412cfe689ad8aafdba63b0e324cc0f23cf5f6b3a74a',
        startsAt: '2026-11-11T04:05:44.000Z',
        target: {
          athleteId: 'owner',
          scope: 'project:workouts',
          taskId:
            'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
          trainingId: 'routine',
        },
      },
      decisionRevision: 2,
      epoch: '8f20596d-9343-4d1a-8233-4eb2ea8b7742',
      expectedRevision: '2',
      expiresAt: 1794283846564,
      key: 'e3ca4e1430fd2f9bfe37dd003d1c2990ec54de10bf354474fabdfbdef8f570ec',
      preparedAt: 1794283546564,
      reason: 'review',
      representationVersion: 1,
      request: {
        action: 'skip',
        operationId: '6a05350e-4c3a-4f61-8b6d-da4fc40eb14c',
        representationVersion: 1,
        target: {
          athleteId: 'owner',
          scope: 'project:workouts',
          taskId:
            'session-occurrence:8437850eac6d44f38848ebb3ce335837ebafe295bb7718c6934f86c106bdfe97',
          trainingId: 'routine',
        },
      },
      sourceVersion: '8944d5b05f5c7ff567e69412cfe689ad8aafdba63b0e324cc0f23cf5f6b3a74a',
      startsAt: '2026-11-11T04:05:44.000Z',
      state: 'review',
    },
    state: 'materialized',
  },
};
