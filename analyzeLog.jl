
# include("analyzeLog.jl")

using JSON

findDiff(d1::Dict,d2::Dict,path::String="") = begin
    for (k,v1) in d1
        valuePath = path * "[\"$k\"]"
        if ! haskey(d2,k)
            println("d1$valuePath = $v1")
            println("d2$valuePath = [[NA]]")
            continue
        end

        local v2 = d2[k]
        if isa(v1,Dict)
            findDiff(v1,v2,valuePath)
        elseif v1 .!= d2[k]
            println("d1$valuePath = $v1")
            println("d2$valuePath = $v2")
        end
    end
end

json = JSON.parsefile("events.txt")

d1 = json[7]["evt"]
d2 = json[4]["evt"]

findDiff(d1,d2)
