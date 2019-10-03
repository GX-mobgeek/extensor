import { EVENTS } from "../constants";

export default function onMultipleClientWarm(io, cb) {
  io.on(EVENTS.MULTIPLE_TRY, () => {
    io.on("disconnect", cb);
  });
}
