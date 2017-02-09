var exports = module.exports = {};

exports.sendToDatabase = function(eventObj, context){
  if(eventObj === null) throw "eventObj is null";
  if(context === null) throw "context is null";

  console.log(eventObj);
  context.models.DockerEvents
    .create({
      Stamp: eventObj["timestamp"]
  }).then((event) => {
      context.models.Actions.findOrCreate({
        where: {Name: eventObj["action"]},
        defaults: {Name: eventObj["action"]}
      }).spread((action, create) => {
        event.setDataValue("ActionId", action.getDataValue("Id"));
        event.save();
      });

      context.models.Actors.findOrCreate({
        where: {Name: eventObj["actor"].name},
        defaults: {Name: eventObj["actor"].name}
      }).spread((actor, create) => {
        event.setDataValue("ActorId", actor.getDataValue("Id"));
        event.save();
      });

      context.models.Requests.create({
        Addr: eventObj["request"].addr,
        Host: eventObj["request"].host
      }).then((request) => {
        event.setDataValue("RequestId", request.getDataValue("Id"));
        event.save();
      });

      context.models.Tags.findOrCreate({
        where: {Name: eventObj["target"].tag},
        defaults: {Name: eventObj["target"].tag}
      }).spread((tag, created) => {
        context.models.Repositories.findOrCreate({
          where: {Name: eventObj["target"].repository},
          defaults: {
            Name: eventObj["target"].repository,
            TagId: tag.getDataValue("Id")
          }
        }).spread((repo, created) => {
          event.setDataValue(
            "RepositoryId",
            repo.getDataValue("Id"));
          event.save();
          context.models.Targets.create({
            Size: eventObj["target"].size,
            Digest: eventObj["target"].digest,
            RepositoryId: repo.getDataValue("Id"),
            Url: eventObj["target"].url,
            TagId: tag.getDataValue("Id")
          }).then((target) => {
            event.setDataValue("TargetId", target.getDataValue("Id"));
          });
        });
      });

      context.models.Sources.create({
        Addr: eventObj["source"].addr,
        InstanceId: eventObj["source"].instanceId
      }).then((source) => {
        event.setDataValue("SourceId", source.getDataValue("Id"));
        event.save();
      });
  });
};